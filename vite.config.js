import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import streamHandler from './api/stream.js';

function streamApi() {
  return {
    name: 'stream-api',
    configureServer(server) {
      server.middlewares.use('/api/stream', async (request, response, next) => {
        const url = new URL(request.url || '', 'http://localhost');
        const output = {
          status(code) {
            response.statusCode = code;
            return output;
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

        try {
          await streamHandler({
            method: request.method,
            query: Object.fromEntries(url.searchParams),
            headers: request.headers,
          }, output);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), streamApi()],
});
