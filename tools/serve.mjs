// A tiny static server for working on the page locally (ES modules do not load from file://).
//   node tools/serve.mjs [port]     → http://localhost:8790
// It also answers /api/save like the Vercel Function, from a SQLite file in notes/ (ignored by git);
// the master password is SYNC_PASSWORD, or "dev" when it is not set.

import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handle, fromEnv } from '../server/sync.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.argv[2] ?? process.env.PORT ?? 8790);
await mkdir(path.join(root, 'notes'), { recursive: true });
const cloud = fromEnv({ SYNC_PASSWORD: 'dev', ...process.env }, { localFile: path.join(root, 'notes', 'sync-dev.db') });

async function api(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handle(request, await cloud);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/save') return await api(req, res);
    let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root) || file.includes(`${path.sep}notes${path.sep}`)) throw Object.assign(new Error('forbidden'), { code: 403 });
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch (err) {
    res.writeHead(err.code === 403 ? 403 : 404, { 'content-type': 'text/plain' });
    res.end(err.code === 403 ? 'forbidden' : 'not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}`));
