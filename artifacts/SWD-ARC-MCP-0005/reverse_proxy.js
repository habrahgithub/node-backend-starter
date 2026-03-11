const http = require('http');
const https = require('https');
const { URL } = require('url');
const token = process.env.PROXY_TOKEN;
const target = new URL(process.env.PROXY_TARGET || 'http://127.0.0.1:3000');
const port = Number(process.env.PROXY_PORT || 3333);
function json(res, code, payload){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(payload));}
const server = http.createServer((req,res)=>{
  if (req.headers['x-proxy-token'] !== token) return json(res,401,{error:'proxy auth required'});
  const opts = {protocol:target.protocol,hostname:target.hostname,port:target.port,method:req.method,path:req.url,headers:{...req.headers,host:target.host}};
  const transport = target.protocol === 'https:' ? https : http;
  const up = transport.request(opts,(upRes)=>{res.writeHead(upRes.statusCode||502,upRes.headers);upRes.pipe(res);});
  up.on('error',(e)=>json(res,502,{error:'upstream',detail:e.message}));
  req.pipe(up);
});
server.listen(port,'127.0.0.1',()=>console.log(`proxy listening on 127.0.0.1:${port}`));
