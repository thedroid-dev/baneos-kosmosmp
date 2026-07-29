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
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
        proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9,en;q=0.8');
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // --- 1. SUPER CSS: SOBRESCRIBE EL 100% DE LA INTERFAZ A NEGRO/GRIS/BLANCO ---
          const keefPacksThemeCSS = `
            <style id="keefpacks-master-theme">
              /* Fondo general y reset de colores */
              html, body, div, header, main, footer, section, nav, aside {
                background-color: #08080a !important;
                color: #e4e4e7 !important;
                font-family: system-ui, -apple-system, sans-serif !important;
              }

              /* Anular colores verdes nativos */
              *[class*="green"], *[class*="emerald"], *[style*="rgb(16, 185, 129)"], *[style*="#10b981"] {
                color: #ffffff !important;
                background-color: #27272a !important;
                border-color: #3f3f46 !important;
              }

              /* Tarjetas e ítems de paquetes (Gris Oscuro + Bordes Plata) */
              article, .card, [class*="card"], [class*="pack-card"], [class*="Item"], [class*="box"] {
                background: #121216 !important;
                border: 1px solid #27272a !important;
                border-radius: 14px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8) !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }

              article:hover, .card:hover, [class*="card"]:hover, [class*="pack-card"]:hover {
                transform: translateY(-3px) !important;
                border-color: #ffffff !important;
                box-shadow: 0 8px 30px rgba(255, 255, 255, 0.1) !important;
              }

              /* Botones principales y de interacción */
              button, .btn, [class*="button"], [class*="btn"] {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 700 !important;
                border-radius: 10px !important;
                border: none !important;
                transition: filter 0.2s ease, transform 0.1s ease !important;
              }

              button:hover, .btn:hover {
                filter: brightness(0.85) !important;
                transform: scale(1.02) !important;
              }

              /* Barra de Búsqueda Renovada */
              input[type="text"], input[type="search"] {
                background: #121216 !important;
                color: #ffffff !important;
                border: 1px solid #3f3f46 !important;
                border-radius: 999px !important;
                padding: 12px 20px !important;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important;
              }

              input[type="text"]:focus, input[type="search"]:focus {
                border-color: #ffffff !important;
                outline: none !important;
              }

              /* Ocultar secciones de pago, Packs+, cape shop y enlaces a su Discord */
              [href*="discord"], [href*="packs-plus"], [href*="plus"], 
              [href*="cape"], [class*="plus"], [class*="exclusive"], 
              [class*="VIP"], [class*="pricing"], [class*="premium"] {
                display: none !important;
              }

              /* Badges de versión y resolución (16x, 128x, etc) */
              [class*="badge"], [class*="tag"], [class*="chip"] {
                background: #27272a !important;
                color: #ffffff !important;
                border: 1px solid #3f3f46 !important;
                border-radius: 6px !important;
              }

              /* Header y Navegación Flotante */
              header, [class*="navbar"], [class*="header"] {
                background: rgba(18, 18, 22, 0.9) !important;
                backdrop-filter: blur(12px) !important;
                border-bottom: 1px solid #27272a !important;
              }
            </style>
          `;

          // --- 2. JAVASCRIPT: REESCRIBE TEXTOS Y VIGILA EL RENDERIZADO ---
          const keefPacksEngineJS = `
            <script id="keefpacks-script">
              document.title = "KEEFPACKS — Texture Packs Vault (Black Edition)";

              function applyKeefPacksRules(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  let text = node.nodeValue;
                  if (text.includes('PacksMC') || text.includes('PackMC') || text.includes('packsmc')) {
                    node.nodeValue = text.replace(/PacksMC/gi, 'KeefPacks')
                                         .replace(/PackMC/gi, 'KeefMC')
                                         .replace(/packsmc/gi, 'keefpacks')
                                         .replace(/Paquetes Exclusivos/gi, 'Destacados')
                                         .replace(/Packs\+/gi, 'Gratis');
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Ocultar enlaces directos no deseados
                  const href = node.getAttribute('href') || '';
                  if (href.includes('discord') || href.includes('plus') || href.includes('checkout') || href.includes('cape')) {
                    node.style.setProperty('display', 'none', 'important');
                    return;
                  }
                  for (let child of node.childNodes) {
                    applyKeefPacksRules(child);
                  }
                }
              }

              window.addEventListener('DOMContentLoaded', () => {
                applyKeefPacksRules(document.body);
              });

              const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                  m.addedNodes.forEach((n) => applyKeefPacksRules(n));
                });
              });

              observer.observe(document.documentElement, { childList: true, subtree: true });
            </script>
          `;

          // Inyección en el DOM
          html = html.replace('</head>', `${keefPacksThemeCSS}</head>`);
          html = html.replace('</body>', `${keefPacksEngineJS}</body>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
