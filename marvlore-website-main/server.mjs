import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.webp':'image/webp',
  '.png':'image/png',
  '.svg':'image/svg+xml',
  '.mp4':'video/mp4',
  '.woff2':'font/woff2',
  '.ttf':'font/ttf',
  '.json':'application/json',
};
const MEDIA_EXTS=new Set(['.webp','.png','.jpg','.jpeg','.svg','.mp4','.woff2','.ttf']);

function loadManifest(){
  const file=path.join(root,'asset-manifest.json');
  if(!existsSync(file)) return null;
  try{ return JSON.parse(readFileSync(file,'utf8')); }
  catch{ return null; }
}

let manifest=loadManifest();

function cacheControl(relPath, version, ext){
  if(ext==='.html' || relPath==='asset-manifest.json') return 'no-cache';
  const expected=manifest?.assets?.[relPath];
  if(version && expected && version===expected){
    return 'public, max-age=31536000, immutable';
  }
  if(version) return 'public, max-age=0, must-revalidate';
  if(MEDIA_EXTS.has(ext) || relPath.startsWith('assets/')){
    // Unhashed media fallback: day-long cache
    return 'public, max-age=86400';
  }
  return 'no-cache';
}

function corsHeaders(ext){
  // Allow cross-origin font/media fetch when this origin is used as mediaCdnBase
  if(!MEDIA_EXTS.has(ext)) return {};
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS',
    'Cross-Origin-Resource-Policy':'cross-origin',
  };
}

async function buildWorkSitemap(origin){
  const cmsBase=(process.env.CMS_BASE||'http://127.0.0.1:1337').replace(/\/$/,'');
  const locales=['zh-CN','en'];
  const urls=[];
  for(const locale of locales){
    try{
      const res=await fetch(`${cmsBase}/api/work-projects?locale=${encodeURIComponent(locale)}&pageSize=48&sort=manual`,{
        headers:{Accept:'application/json'},
      });
      if(!res.ok) continue;
      const json=await res.json();
      const rows=json?.data||[];
      if(!rows.length) continue; // only emit locales that have published content
      urls.push({
        loc:`${origin}/?cmsWork=all&cmsLocale=${encodeURIComponent(locale)}#work`,
        locale,
      });
      for(const row of rows){
        const id=row.legacyId||row.slug;
        if(!id) continue;
        urls.push({
          loc:`${origin}/?cmsWork=all&cmsLocale=${encodeURIComponent(locale)}#case/${encodeURIComponent(id)}`,
          locale,
        });
      }
    }catch{
      // CMS unreachable — skip locale
    }
  }
  const body=[
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((entry)=>`  <url><loc>${entry.loc.replace(/&/g,'&amp;')}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return body;
}

const server=http.createServer(async(req,res)=>{
 try{
  if(req.method==='OPTIONS'){
    res.writeHead(204,{
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS',
      'Access-Control-Max-Age':'86400',
    }).end();
    return;
  }
  if(req.url?.includes('asset-manifest.json') || !manifest) manifest=loadManifest();
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/sitemap-work.xml'){
    const origin=process.env.SITE_ORIGIN||`http://127.0.0.1:${server.address()?.port||5173}`;
    const xml=await buildWorkSitemap(origin);
    res.writeHead(200,{
      'Content-Type':'application/xml; charset=utf-8',
      'Cache-Control':'public, max-age=300',
    });
    res.end(xml);
    return;
  }
  const requested=decodeURIComponent(url.pathname);
  const version=url.searchParams.get('v');
  const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  const body=await readFile(file);
  const ext=path.extname(file).toLowerCase();
  const rel=path.relative(root,file).split(path.sep).join('/');
  const headers={
    'Content-Type':types[ext]||'application/octet-stream',
    'Cache-Control':cacheControl(rel,version,ext),
    ...corsHeaders(ext),
  };
  if(req.headers.range&&ext==='.mp4'){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let start=match?.[1]?Number(match[1]):Math.max(0,body.length-Number(match?.[2]||body.length));
   let end=match?.[1]&&match[2]?Number(match[2]):body.length-1;
   if(!match||start>end||start>=body.length){res.writeHead(416,{'Content-Range':`bytes */${body.length}`,...corsHeaders(ext)}).end();return;}
   end=Math.min(end,body.length-1);
   res.writeHead(206,{
     ...headers,
     'Accept-Ranges':'bytes',
     'Content-Range':`bytes ${start}-${end}/${body.length}`,
     'Content-Length':end-start+1,
   });
   res.end(body.subarray(start,end+1));
   return;
  }
  res.writeHead(200,headers);
  res.end(body);
 }catch{res.writeHead(404).end('Not found');}
});
const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT)||5173;
server.listen(port,host,()=>console.log(`Local: http://127.0.0.1:${server.address().port} (bind ${host})`));
