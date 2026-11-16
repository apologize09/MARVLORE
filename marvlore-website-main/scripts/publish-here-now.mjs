import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const project=fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(await fs.readFile(new URL('../deployment.json',import.meta.url),'utf8'));
const root=path.resolve(project,config.directory);
if(!root.startsWith(project)||!/^https:\/\/[a-z0-9-]+\.here\.now\/$/.test(config.url)||!/^[-a-z0-9]+$/.test(config.slug))throw Error('Invalid deployment configuration.');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
async function walk(dir){
 const files=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(file));
  else if(entry.isFile())files.push(file);
 }
 return files;
}
const files=await Promise.all((await walk(root)).map(async file=>{
 const data=await fs.readFile(file);
 return {path:path.relative(root,file).split(path.sep).join('/'),size:data.length,contentType:types[path.extname(file)]||'application/octet-stream',hash:hash(data)};
}));
if(!files.some(file=>file.path==='index.html'))throw Error('Missing dist/index.html.');
console.log(JSON.stringify({site:config.url,fileCount:files.length,totalBytes:files.reduce((sum,file)=>sum+file.size,0)}));
if(process.argv.includes('--dry-run'))process.exit(0);
const key=process.env.HERENOW_API_KEY;
if(!key)throw Error('Add the HERENOW_API_KEY Actions secret before publishing.');
const headers={'Content-Type':'application/json','X-HereNow-Client':'github-actions/direct-api',Authorization:'Bearer '+key};
const endpoint='https://api.here.now/api/v1/publish/'+config.slug;
async function request(url,options){
 for(let attempt=0;attempt<4;attempt++){
  try{
   const response=await fetch(url,{...options,signal:AbortSignal.timeout(90000)});
   if(response.status<500&&response.status!==429)return response;
   await response.body?.cancel();
   if(attempt===3)throw Error('Hosting service unavailable.');
  }catch(error){if(attempt===3)throw error;}
  await pause(1500*(attempt+1));
 }
}
async function readJson(response,label){
 const body=await response.json();
 if(!response.ok)throw Error(label+' failed (HTTP '+response.status+').');
 return body;
}
// Read before writing; access/ownership settings are never changed by this script.
const current=await readJson(await request(endpoint,{headers}),'Reading the existing site');
if(current.pendingVersionId)throw Error('Another publication is pending. Complete it before starting this run.');
const site=await readJson(await request(endpoint,{method:'PUT',headers,body:JSON.stringify({displayName:config.displayName,files})}),'Preparing publication');
if(!site.upload?.uploads||!site.upload?.versionId||!site.upload?.finalizeUrl)throw Error('Missing upload instructions.');
const finalizeUrl=new URL(site.upload.finalizeUrl);
if(!['https://api.here.now','https://here.now'].includes(finalizeUrl.origin))throw Error('Unexpected finalize destination.');
const byPath=new Map(files.map(file=>[file.path,file]));
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
 while(cursor<site.upload.uploads.length){
  const item=site.upload.uploads[cursor++];
  if(!byPath.has(item.path)||new URL(item.url).protocol!=='https:')throw Error('Unexpected upload instruction.');
  const response=await request(item.url,{method:'PUT',headers:item.headers||{'Content-Type':byPath.get(item.path).contentType},body:await fs.readFile(path.join(root,item.path))});
  if(!response.ok)throw Error('Uploading '+item.path+' failed (HTTP '+response.status+').');
  await response.body?.cancel();
 }
}));
console.log(JSON.stringify({uploaded:site.upload.uploads.length,reused:site.upload.skipped?.length||0,versionId:site.upload.versionId}));
let finish;
for(let attempt=0;attempt<24;attempt++){
 const response=await request(finalizeUrl,{method:'POST',headers,body:JSON.stringify({versionId:site.upload.versionId})});
 finish=await response.json();
 if(response.ok&&finish.success)break;
 const reason=String(finish.error?.message||finish.error||finish.message||'');
 if(response.status===409&&/in flight/i.test(reason)&&attempt<23){await pause(5000);continue;}
 throw Error('Finalizing publication failed (HTTP '+response.status+'). Version: '+site.upload.versionId);
}
// The full live manifest is checked through the authenticated read API. A bounded
// public check confirms that visitors are receiving the same version at the URL.
const live=await readJson(await request(endpoint,{headers}),'Reading published version');
if(live.manifest?.length!==files.length||files.some(file=>!live.manifest.some(remote=>remote.path===file.path&&remote.hash===file.hash)))throw Error('Published manifest does not match the build.');
for(const pathname of ['index.html','app.js','hero/orbit.js']){
 const file=byPath.get(pathname);if(!file)continue;
 let verified=false;
 for(let attempt=0;attempt<8;attempt++){
  const url=new URL(pathname,config.url);url.searchParams.set('release',live.currentVersionId);
  const response=await request(url,{cache:'no-store'});
  if(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===file.hash){verified=true;break;}
  await pause(2500);
 }
 if(!verified)throw Error('Public file has not updated: '+pathname);
}
const result={published:true,url:config.url,versionId:live.currentVersionId,publishStatus:finish.publishStatus};
console.log(JSON.stringify(result));
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## MARVLORE 已发布\n\n[打开官网](${config.url})\n\n版本：${live.currentVersionId}\n\n已核对线上文件与本次构建一致。\n`);
