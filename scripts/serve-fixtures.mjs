import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 4173);
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(rootDir, '../tests/fixtures');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? '/', `http://localhost:${port}`);
    const requestedPath =
      requestUrl.pathname === '/' ? '/job-application.html' : requestUrl.pathname;
    const safePath = path.normalize(requestedPath).replace(/^([/\\])+/, '');
    const filePath = path.resolve(fixturesDir, safePath);

    if (!filePath.startsWith(fixturesDir)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const content = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
    });
    res.end(content);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Fixture server ready: http://localhost:${port}/job-application.html`);
});
