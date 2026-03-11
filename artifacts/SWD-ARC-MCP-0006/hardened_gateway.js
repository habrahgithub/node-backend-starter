const https = require('https');
const http = require('http');
const fs = require('fs');
const cert = fs.readFileSync(process.env.TLS_CERT);
const key = fs.readFileSync(process.env.TLS_KEY);
const gatewayToken = process.env.GATEWAY_TOKEN || '';
const upstreamApiKey = process.env.UPSTREAM_API_KEY || '';
const upstreamHost = process.env.UPSTREAM_HOST || '127.0.0.1';
const upstreamPort = Number(process.env.UPSTREAM_PORT || 3000);
const listenPort = Number(process.env.LISTEN_PORT || 8443);
const ratePerSec = Number(process.env.RATE_LIMIT_RPS || 10);
const buckets = new Map();
function allow(ip){const now=Date.now();const arr=(buckets.get(ip)||[]).filter(t=>now-t<1000);if(arr.length>=ratePerSec){buckets.set(ip,arr);return false;}arr.push(now);buckets.set(ip,arr);return true;}
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj));}
const server=https.createServer({cert,key},(req,res)=>{
  const ip=(req.socket&&req.socket.remoteAddress)||'unknown';
  if(!allow(ip)) return json(res,429,{error:'rate limit exceeded'});
  if((req.headers['x-gateway-token']||'')!==gatewayToken) return json(res,401,{error:'unauthorized'});
  const headers={...req.headers,host:`${upstreamHost}:${upstreamPort}`,'authorization':`Bearer ${upstreamApiKey}`};
  delete headers['x-gateway-token'];
  const opts={hostname:upstreamHost,port:upstreamPort,method:req.method,path:req.url,headers};
  const up=http.request(opts,(upRes)=>{res.writeHead(upRes.statusCode||502,upRes.headers);upRes.pipe(res);});
  up.on('error',e=>json(res,502,{error:'upstream error',detail:e.message}));
  req.pipe(up);
});
server.listen(listenPort,'0.0.0.0',()=>console.log(`hardened gateway listening on https://0.0.0.0:${listenPort}`));
