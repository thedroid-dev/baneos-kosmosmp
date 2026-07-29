const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const serverless = require('serverless-http');

const app = express();

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://packsmc.com',
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Host', 'packsmc.com');
        proxyReq.setHeader('Referer', 'https://packsmc.com/');
        proxyReq.setHeader('Origin', 'https://packsmc.com');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        // Forzar texto plano para evitar datos binarios corruptos
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];
        // Limpiar codificación ya que entregaremos texto plano modificado
        delete proxyRes.headers['content-encoding'];

        const contentType = proxyRes.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // INYECCIÓN DE TUS ESTILOS Y MARCA (KEEFPACKS / 71x7)
          const customStyle = `
            <style id="keefpacks-master">
              :root {
                --bg-main: #050507 !important;
                --bg-card: #0f0f14 !important;
                --border-color: #22222d !important;
              }
              html, body, div, header, main, footer, section, nav, article {
                background-color: #050507 !important;
                color: #ffffff !important;
              }
              [class*="green"], [class*="emerald"], [style*="rgb(16, 185, 129)"], [style*="#10b981"] {
                color: #ffffff !important;
                background-color: #1a1a22 !important;
              }
              article, .card, [class*="card"] {
                background: #0f0f14 !important;
                border: 1px solid #22222d !important;
                border-radius: 14px !important;
              }
              [href*="discord"], [href*="plus"], [class*="plus"] {
                display: none !important;
              }
              button, .btn {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 800 !important;
                border-radius: 10px !important;
              }
              footer::after {
                content: "KeefPacks © 2026 — Desarrollado y administrado por 71x7" !important;
                display: block !important;
                text-align: center !important;
                padding: 24px !important;
                color: #71717a !important;
                font-size: 13px !important;
                font-weight: 600 !important;
              }
            </style>
            <script>
              document.title = "KEEFPACKS — Texture Packs Vault (por 71x7)";
            </script>
          `;

          html = html.replace(/PacksMC/gi, 'KeefPacks').replace(/PackMC/gi, 'KeefMC');
          html = html.replace('</head>', `${customStyle}</head>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports.handler = serverless(app);
