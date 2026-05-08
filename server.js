const http = require('http');
const fs = require('fs');
const path = require('path');
const base = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  const reqPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(path.join(base, reqPath));
  if (!safePath.startsWith(base)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(safePath, (err,data)=>{
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    res.writeHead(200, {'Content-Type': mime[path.extname(safePath)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(8000, ()=>console.log('Server running: http://localhost:8000'));
