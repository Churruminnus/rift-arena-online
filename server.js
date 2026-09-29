'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 10000);
const publicDir = __dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};

function send(res, status, body, type='text/plain; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(body);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') return send(res, 200, JSON.stringify({status:'ok', service:'rift-arena', mode:'bot-local'}), 'application/json');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método não permitido');
  const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.resolve(publicDir, requested);
  if (!file.startsWith(publicDir + path.sep) && file !== path.join(publicDir, 'index.html')) return send(res, 403, 'Acesso negado');
  fs.readFile(file, (error, data) => {
    if (error) return send(res, 404, 'Página não encontrada');
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=300'});
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  });
}).listen(port, '0.0.0.0', () => console.log(`RIFT Arena disponível na porta ${port}`));
