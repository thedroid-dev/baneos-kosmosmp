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
      proxyReq: (proxyReq) => {
        // Enmascarar peticiones para evitar bloqueos de Cloudflare
        proxyReq.setHeader('Host', 'packsmc.com');
        proxyReq.setHeader('Referer', 'https://packsmc.com/');
        proxyReq.setHeader('Origin', 'https://packsmc.com');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
        proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9');
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // 1. INYECCIÓN DE CSS MONOCROMÁTICO (Oculta todo lo de PacksMC)
          const customCSS = `
            <style id="keefpacks-override">
              /* Eliminar colores verdes y aplicar temática Negro/Gris/Blanco */
              :root {
                --primary: #ffffff !important;
                --bg-main: #050507 !important;
                --bg-card: #0f0f14 !important;
                --border-color: #22222d !important;
              }

              html, body, div, header, main, footer, section, nav, article {
                background-color: #050507 !important;
                color: #ffffff !important;
                box-shadow: none !important;
              }

              /* Ocultar elementos verdes y sustituirlos */
              [class*="green"], [class*="emerald"], [style*="rgb(16, 185, 129)"], [style*="#10b981"] {
                color: #ffffff !important;
                background-color: #1a1a22 !important;
                border-color: #22222d !important;
              }

              /* Tarjetas de packs */
              article, .card, [class*="card"], [class*="pack-card"] {
                background: #0f0f14 !important;
                border: 1px solid #22222d !important;
                border-radius: 16px !important;
              }

              article:hover, .card:hover {
                border-color: #ffffff !important;
              }

              /* Ocultar secciones no deseadas (Discord de ellos, logins externos, planes) */
              [href*="discord"], [href*="plus"], [class*="plus"], [class*="pricing"], [class*="owner"] {
                display: none !important;
              }

              /* Botones Blancos */
              button, .btn, [class*="button"] {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 800 !important;
                border-radius: 10px !important;
              }

              /* Footer propio de 71x7 */
              footer::after {
                content: "KeefPacks © 2026 — Administrado y Desarrollado por 71x7" !important;
                display: block !important;
                text-align: center !important;
                padding: 20px !important;
                color: #71717a !important;
                font-size: 12px !important;
              }
            </style>
          `;

          // 2. JAVASCRIPT DE SUSTITUCIÓN EN TIEMPO REAL (Buscador y Nombre)
          const customJS = `
            <script id="keefpacks-brain">
              document.title = "KEEFPACKS — Texture Packs Vault (por 71x7)";

              function applyBranding(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  let txt = node.nodeValue;
                  if (txt.includes('PacksMC') || txt.includes('PackMC') || txt.includes('packsmc')) {
                    node.nodeValue = txt.replace(/PacksMC/gi, 'KeefPacks')
                                        .replace(/PackMC/gi, 'KeefMC')
                                        .replace(/packsmc/gi, 'keefpacks');
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const href = node.getAttribute('href') || '';
                  if (href.includes('discord') || href.includes('plus')) {
                    node.style.setProperty('display', 'none', 'important');
                    return;
                  }
                  for (let child of node.childNodes) {
                    applyBranding(child);
                  }
                }
              }

              window.addEventListener('DOMContentLoaded', () => applyBranding(document.body));

              const observer = new MutationObserver((mutations) => {
                mutations.forEach(m => m.addedNodes.forEach(n => applyBranding(n)));
              });
              observer.observe(document.documentElement, { childList: true, subtree: true });
            </script>
          `;

          html = html.replace('</head>', `${customCSS}</head>`);
          html = html.replace('</body>', `${customJS}</body>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
