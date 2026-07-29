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
        proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9');
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');

          // --- 1. CSS EXTREMO: ANIQUILA EL VERDE Y LOS EFECTOS DE PACKSMC ---
          const totalRedesignCSS = `
            <style id="keefpacks-total-overhaul">
              /* RESET TOTAL A MONOCROMÁTICO (Negro, Gris, Blanco) */
              :root {
                --primary: #ffffff !important;
                --bg-main: #050507 !important;
                --bg-card: #0f0f14 !important;
                --border-color: #22222d !important;
              }

              /* Anulamos TODOS los verdes de raíz */
              *, *::before, *::after {
                border-color: var(--border-color) !important;
              }

              html, body, div, header, main, footer, section, nav, aside, article {
                background-color: var(--bg-main) !important;
                color: #e4e4e7 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }

              /* Anular elementos verdes/emerald o acentos brillantes */
              [class*="green"], [class*="emerald"], [style*="rgb(16, 185, 129)"], [style*="#10b981"], [class*="accent"] {
                color: #ffffff !important;
                background-color: #1c1c24 !important;
              }

              /* Tarjetas de paquetes totalmente renovadas */
              article, .card, [class*="card"], [class*="pack-card"], [class*="Item"] {
                background: var(--bg-card) !important;
                border: 1px solid var(--border-color) !important;
                border-radius: 16px !important;
                transition: transform 0.2s ease, border-color 0.2s ease !important;
              }

              article:hover, .card:hover, [class*="card"]:hover {
                transform: translateY(-4px) !important;
                border-color: #ffffff !important;
              }

              /* Botones Blancos Minimalistas */
              button, .btn, [class*="button"], [class*="btn"], input[type="submit"] {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 800 !important;
                border-radius: 12px !important;
                border: none !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
              }

              /* Buscador y Convertidor Rediseñados */
              input, select, textarea {
                background: #0f0f14 !important;
                color: #ffffff !important;
                border: 1px solid #27272a !important;
                border-radius: 12px !important;
              }

              /* Ocultar secciones no deseadas, pagos, Discord y owners antiguos */
              [href*="discord"], [href*="plus"], [class*="plus"], 
              [class*="owner"], [class*="credits"], [class*="team"],
              [href*="checkout"], [class*="pricing"] {
                display: none !important;
              }

              /* Inyección de Créditos de 71x7 en el Footer */
              footer::after {
                content: "KeefPacks © 2026 — Desarrollado & Administrado por 71x7. Todos los derechos reservados." !important;
                display: block !important;
                text-align: center !important;
                padding: 20px !important;
                font-size: 13px !important;
                color: #71717a !important;
                font-weight: 600 !important;
              }
            </style>
          `;

          // --- 2. JAVASCRIPT: TRADUCCIÓN AL ESPAÑOL + REMOVEDOR DE OWNERS ---
          const totalRedesignJS = `
            <script id="keefpacks-brain">
              document.title = "KEEFPACKS — Creado por 71x7";

              // Diccionario de traducción y reemplazo masivo
              const replacements = [
                [/PacksMC/gi, 'KeefPacks'],
                [/PackMC/gi, 'KeefMC'],
                [/packsmc/gi, 'keefpacks'],
                [/Texture Packs/gi, 'Paquetes de Texturas'],
                [/Resource Packs/gi, 'Paquetes de Recursos'],
                [/Download/gi, 'Descargar'],
                [/Search/gi, 'Buscar'],
                [/Categories/gi, 'Categorías'],
                [/Converter/gi, 'Convertidor'],
                [/Tools/gi, 'Herramientas'],
                [/Exclusive/gi, 'Destacados'],
                [/Created by.*/gi, 'Creado por 71x7'],
                [/Developed by.*/gi, 'Propiedad de 71x7'],
                [/Owner.*/gi, 'Propietario: 71x7']
              ];

              function cleanAndTranslate(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  let text = node.nodeValue;
                  replacements.forEach(([from, to]) => {
                    text = text.replace(from, to);
                  });
                  node.nodeValue = text;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Ocultar elementos de Discord o links a redes de owners viejos
                  const href = node.getAttribute('href') || '';
                  if (href.includes('discord') || href.includes('twitter') || href.includes('plus')) {
                    node.style.setProperty('display', 'none', 'important');
                    return;
                  }
                  for (let child of node.childNodes) {
                    cleanAndTranslate(child);
                  }
                }
              }

              // Ejecutar limpieza al cargar
              window.addEventListener('DOMContentLoaded', () => {
                cleanAndTranslate(document.body);
              });

              // Vigilante constante contra el Javascript dinámico de Next.js
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                  m.addedNodes.forEach((n) => cleanAndTranslate(n));
                });
              });

              observer.observe(document.documentElement, { childList: true, subtree: true });
            </script>
          `;

          html = html.replace('</head>', `${totalRedesignCSS}</head>`);
          html = html.replace('</body>', `${totalRedesignJS}</body>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
