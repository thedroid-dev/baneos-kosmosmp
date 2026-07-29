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
        // Enmascaramiento de identidad hacia el servidor de origen
        proxyReq.setHeader('Host', 'packsmc.com');
        proxyReq.setHeader('Referer', 'https://packsmc.com/');
        proxyReq.setHeader('Origin', 'https://packsmc.com');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8');
        proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9,en;q=0.8');
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        // Desactivamos bloqueos de seguridad e iframe
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        // Si la respuesta es la página HTML
        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // --- REEMPLAZO MASIVO DE MARCA (KeefPacks / KeefMC) ---
          
          // 1. Textos directos de la marca
          html = html.replace(/PacksMC/gi, 'KeefPacks');
          html = html.replace(/PackMC/gi, 'KeefMC');
          html = html.replace(/packsmc\.com/gi, req.headers.host);
          html = html.replace(/packsmc/gi, 'keefpacks');

          // 2. Título de la pestaña y Meta Tags SEO
          html = html.replace(/<title>.*?<\/title>/gi, '<title>KeefPacks — Minecraft Texture Packs & Resources</title>');
          
          // 3. Modificación del Footer / Copyright
          html = html.replace(/©\s*20\d\d\s*PacksMC/gi, '© 2026 KeefPacks. Todos los derechos reservados.');

          // 4. Inyección de CSS para ocultar elementos nativos con el logo viejo si los hay
          const customStyle = `
            <style>
              /* Personalización visual para KeefPacks */
              ::selection {
                background-color: #10b981 !important;
                color: #000 !important;
              }
            </style>
          `;
          html = html.replace('</head>', `${customStyle}</head>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
