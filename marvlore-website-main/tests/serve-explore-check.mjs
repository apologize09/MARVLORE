// Manual desktop GPU regression: node tests/serve-explore-check.mjs
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const fixture=fileURLToPath(new URL('./fixtures/explore-colour.html',import.meta.url));
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),file=url.pathname==='/__colour-check'?fixture:path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(file!==fixture&&!file.startsWith(root))return res.writeHead(403).end();
  const body=await readFile(file),type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'}).end(body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173/__colour-check'));
