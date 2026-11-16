import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4'};
const server=http.createServer(async(req,res)=>{
 try{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  const body=await readFile(file);
  if(req.headers.range&&path.extname(file)==='.mp4'){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let start=match?.[1]?Number(match[1]):Math.max(0,body.length-Number(match?.[2]||body.length));
   let end=match?.[1]&&match[2]?Number(match[2]):body.length-1;
   if(!match||start>end||start>=body.length){res.writeHead(416,{'Content-Range':`bytes */${body.length}`}).end();return;}
   end=Math.min(end,body.length-1);
   res.writeHead(206,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});res.end(body.subarray(start,end+1));return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
 }catch{res.writeHead(404).end('Not found');}
});
server.listen(Number(process.env.PORT)||5173,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));
