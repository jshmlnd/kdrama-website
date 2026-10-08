import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import streamHandler from './api/stream.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const port = Number(process.env.PORT) || 3000;
const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function responseFor(response) {
  return {
    status(code) {
      response.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      response.setHeader(name, value);
    },
    json(body) {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(body));
    },
    send(body) {
      response.end(body);
    },
    stream(body) {
      response.on('close', () => body.destroy());
      body.pipe(response);
    },
  };
}

function serveStatic(request, response) {
  const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = requested === '/' ? 'index.html' : requested.slice(1);
  const file = normalize(join(dist, relative));
  const target = file.startsWith(dist) && existsSync(file) && statSync(file).isFile()
    ? file
    : join(dist, 'index.html');

  response.setHeader('content-type', types[extname(target)] || 'application/octet-stream');
  createReadStream(target).pipe(response);
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/api/stream') {
    if (request.method !== 'GET') {
      response.statusCode = 405;
      response.end('method not allowed');
      return;
    }

    try {
      await streamHandler({
        method: request.method,
        query: Object.fromEntries(url.searchParams),
        headers: request.headers,
      }, responseFor(response));
    } catch (error) {
      console.error('[stream]', error);
      if (!response.writableEnded) {
        response.statusCode = 500;
        response.end('internal server error');
      }
    }
    return;
  }

  serveStatic(request, response);
}).listen(port, () => {
  console.log(`MeiDrama listening on port ${port}`);
});
