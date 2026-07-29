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

          // 1. Inyección de CSS Personalizado (Rediseño total de colores y ocultación de elementos de pago/Discord)
          const customCSS = `
            <style id="keefpacks-custom-ui">
              /* --- NUEVA PALETA DE COLORES KEEFPACKS --- */
              :root {
                --primary-color: #8b5cf6 !important; /* Cambia este HEX para el color principal (ej. Púrpura #8b5cf6 o Cian #06b6d4) */
                --bg-dark: #090d16 !important;
              }

              body {
                background-color: var(--bg-dark) !important;
              }

              /* --- ELIMINAR SECCIONES DE PAGO Y DISCORD ORIGINAL --- */
              /* Oculta insignias de Packs+, planes de pago y tiendas */
              [href*="packs-plus"], [href*="plus"], [class*="plus"], 
              [class*="exclusive"], [class*="vip"], [class*="pricing"],
              /* Oculta enlaces de Discord externos */
              [href*="discord.gg"], [href*="discord.com"] {
                display: none !important;
              }

              /* --- REDISEÑO DE TARJETAS Y CONTENEDORES --- */
              .card, [class*="card"], [class*="pack-card"] {
                border-radius: 16px !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
                transition: transform 0.2s ease, box-shadow 0.2s ease !important;
              }

              .card:hover, [class*="card"]:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 15px 35px -5px rgba(139, 92, 246, 0.25) !important;
              }

              /* --- CUSTOM SEARCH BAR Y BUNDLES --- */
              input[type="text"], input[type="search"] {
                border-radius: 999px !important;
                padding-left: 20px !important;
                border: 2px solid rgba(139, 92, 246, 0.3) !important;
                background: rgba(15, 23, 42, 0.8) !important;
              }

              /* Estilos de botones generales */
              button, .btn, [class*="button"] {
                border-radius: 12px !important;
              }
            </style>
          `;

          // 2. Inyección de JS en vivo para limpiar elementos de pago y cambiar la marca en tiempo real
          const customJS = `
            <script id="keefpacks-engine">
              document.title = "KeefPacks — Minecraft Resources (100% Gratis)";

              function cleanInterface(node) {
                // Reemplazo masivo de nombres
                if (node.nodeType === Node.TEXT_NODE) {
                  if (node.nodeValue.includes('PacksMC') || node.nodeValue.includes('PackMC')) {
                    node.nodeValue = node.nodeValue.replace(/PacksMC/gi, 'KeefPacks')
                                                  .replace(/PackMC/gi, 'KeefMC')
                                                  .replace(/Paquetes Exclusivos/gi, 'Paquetes Destacados')
                                                  .replace(/Packs\+/gi, 'Gratis');
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Remover elementos con enlaces de pago/Discord directamente
                  const href = node.getAttribute('href') || '';
                  if (href.includes('discord') || href.includes('plus') || href.includes('checkout')) {
                    node.remove();
                    return;
                  }
                  for (let child of node.childNodes) {
                    cleanInterface(child);
                  }
                }
              }

              // Limpiar apenas cargue el DOM
              window.addEventListener('DOMContentLoaded', () => {
                cleanInterface(document.body);
              });

              // Limpieza activa contra el re-renderizado de Next.js
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                  m.addedNodes.forEach((n) => cleanInterface(n));
                });
              });

              observer.observe(document.documentElement, { childList: true, subtree: true });
            </script>
          `;

          // Inyectar CSS en el <head> y JS en el </body>
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
