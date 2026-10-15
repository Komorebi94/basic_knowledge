import { createServer } from 'node:http';
import { URL } from 'node:url';

// A disposable origin for reviewed browser examples; no application or personal data.
export async function startArticleFixture(worker, offlinePage, vueRuntime, routerRuntime, ssrFixture, reactFixture) {
  if (typeof worker !== 'string' || typeof offlinePage !== 'string') throw new TypeError('Missing reviewed Service Worker source');
  let version = 1;
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    response.setHeader('Cache-Control', 'no-store');
    if (path === '/react.mjs' && reactFixture) {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(reactFixture.runtime);
    } else if (path === '/react-ssr.json' && reactFixture) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ html: reactFixture.html, initial: 1 }));
    } else if (path === '/vue.mjs' && typeof vueRuntime === 'string') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(vueRuntime);
    } else if (path === '/vue-router.mjs' && typeof routerRuntime === 'string') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(routerRuntime);
    } else if (path === '/ssr-order-app.mjs' && ssrFixture) {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(ssrFixture.source.replace("from 'vue'", "from '/vue.mjs'"));
    } else if (path === '/ssr-order.json' && ssrFixture) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(ssrFixture.order));
    } else if (path === '/ssr-nesting.json' && ssrFixture) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(ssrFixture.nesting));
    } else if (path === '/k04-sw.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(worker.replaceAll('k04-shell-v1', `k04-shell-v${version}`));
    } else if (path === '/offline.html') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(offlinePage);
    } else if (path === '/' || path === '/offline-demo') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end('<!doctype html><h1>Online lesson</h1>');
    } else { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    setVersion(next) { version = next; },
    async close() {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}
