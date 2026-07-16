import http from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, 'dist');
const port = 3000;

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function getContentType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
}

function resolveFile(requestPath) {
  const normalized = decodeURIComponent(requestPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = path.join(rootDir, normalized);
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  const indexCandidate = path.join(rootDir, normalized, 'index.html');
  if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) return indexCandidate;

  return path.join(rootDir, 'index.html');
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url ?? '/');
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': getContentType(filePath) });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Static server ready at http://localhost:${port}/`);
});
