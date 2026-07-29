const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://packsmc.com',
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', 'packsmc.com');
        proxyReq.setHeader('Referer', 'https://packsmc.com/');
        proxyReq.setHeader('Origin', 'https://packsmc.com');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8');
        proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9,en;q=0.8');
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // 1. Reemplazos estáticos directos
          html = html.replace(/PacksMC/gi, 'KeefPacks');
          html = html.replace(/PackMC/gi, 'KeefMC');
          html = html.replace(/packsmc\.com/gi, req.headers.host);

          // 2. Inyección de script dinámico para sobreescribir el JavaScript de Next.js
          const overrideScript = `
            <script>
              document.title = "KeefPacks — Minecraft Resource Vault";
              
              function replaceTextInNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  node.nodeValue = node.nodeValue.replace(/PacksMC/gi, 'KeefPacks')
                                                .replace(/PackMC/gi, 'KeefMC')
                                                .replace(/packsmc/gi, 'keefpacks');
                } else {
                  for (let child of node.childNodes) {
                    replaceTextInNode(child);
                  }
                }
              }

              // Reemplazar inmediatamente al cargar
              window.addEventListener('DOMContentLoaded', () => {
                replaceTextInNode(document.body);
              });

              // Observador que vigila cambios dinámicos en la pantalla (Next.js)
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                    replaceTextInNode(node);
                  });
                });
              });

              observer.observe(document.documentElement, {
                childList: true,
                subtree: true
              });
            </script>
          `;

          html = html.replace('</body>', `${overrideScript}</body>`);
          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
