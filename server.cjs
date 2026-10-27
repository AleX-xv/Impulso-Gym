'use strict';
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

// Only the application's public files are served; configuration stays private.
const publicFiles = new Map([
  ['/index.html', 'text/html; charset=utf-8'],
  ['/ideas.html', 'text/html; charset=utf-8'],
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/ideas.css', 'text/css; charset=utf-8'],
  ['/app.js', 'text/javascript; charset=utf-8'],
  ['/ideas.js', 'text/javascript; charset=utf-8'],
  ['/ideas-data.js', 'text/javascript; charset=utf-8']
]);

function sendText(response, status, message, method) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  response.end(method === 'HEAD' ? undefined : message);
}
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    sendText(response, 405, 'Método no permitido', request.method); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { sendText(response, 400, 'Solicitud no válida', request.method); return; }
  if (pathname === '/') pathname = '/index.html';
  const contentType = publicFiles.get(pathname);
  if (!contentType) { sendText(response, 404, 'Página no encontrada', request.method); return; }
  const filePath = path.join(__dirname, pathname.slice(1));
  fs.stat(filePath, (error, info) => {
    if (error || !info.isFile()) { sendText(response, 404, 'Archivo no encontrado', request.method); return; }
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
});
if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  server.listen(port, '0.0.0.0', () => console.log(`IMPULSO disponible en el puerto ${port}`));
}
module.exports = { server };
