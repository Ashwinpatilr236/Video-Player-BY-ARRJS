import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import http from 'http';
import https from 'https';

const corsProxyPlugin = (): Plugin => ({
  name: 'cors-proxy-plugin',
  configureServer(server) {
    server.middlewares.use('/api/proxy', (req, res) => {
      const fullUrl = new URL(req.url || '', 'http://localhost');
      const targetUrl = fullUrl.searchParams.get('url');

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (!targetUrl) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing url parameter' }));
        return;
      }

      try {
        const parsedTarget = new URL(targetUrl);
        const isHttps = parsedTarget.protocol === 'https:';
        const client = isHttps ? https : http;

        const proxyReq = client.request(
          targetUrl,
          {
            method: req.method,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': '*/*',
            },
          },
          (proxyRes) => {
            const headers = { ...proxyRes.headers };
            headers['Access-Control-Allow-Origin'] = '*';
            headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, HEAD';
            headers['Access-Control-Allow-Headers'] = '*';
            res.writeHead(proxyRes.statusCode || 200, headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
          }
        });

        req.pipe(proxyReq);
      } catch (err: unknown) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid URL', details: err instanceof Error ? err.message : String(err) }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), corsProxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
