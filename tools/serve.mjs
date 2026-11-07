import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||8765);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
 let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return;}
 const target=path.resolve(root,'.'+(url.endsWith('/')?url+'index.html':url));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.stat(target,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}
  fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
 });
}).on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Open http://127.0.0.1:${port}/character.html or set PORT to another port.`:error.message);process.exitCode=1;}).listen(port,'127.0.0.1',()=>console.log(`青蘅人物志 http://127.0.0.1:${port}/character.html\n云栖试玩 http://127.0.0.1:${port}/\nCtrl+C stops the server.`));
