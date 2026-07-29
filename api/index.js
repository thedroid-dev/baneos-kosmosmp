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

          // --- 1. INYECCIÓN DE FONTAWESOME Y CSS DE REDISEÑO TOTAL ---
          const customHead = `
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style id="keefpacks-absolute-theme">
              /* RESET MONOCROMÁTICO (Negro / Gris / Blanco) */
              :root {
                --bg-black: #050507 !important;
                --bg-card: #0f0f14 !important;
                --border-subtle: #22222d !important;
                --text-main: #ffffff !important;
                --text-muted: #8e8e93 !important;
              }

              /* ELIMINAR EFECTOS DE TOQUE, PARTÍCULAS Y COLORES VERDES */
              *, *::before, *::after {
                border-color: var(--border-subtle) !important;
                outline: none !important;
                -webkit-tap-highlight-color: transparent !important;
              }

              html, body, div, header, main, footer, section, nav, aside, article, canvas {
                background-color: var(--bg-black) !important;
                color: var(--text-main) !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }

              /* Desactivar cualquier canvas de fondo o animaciones de partículas */
              canvas, [id*="particle"], [class*="particle"], [class*="effect"] {
                display: none !important;
              }

              /* ANULAR TODOS LOS ELEMENTOS VERDES Y SUSTITUIR POR NEGRO/BLANCO */
              [class*="green"], [class*="emerald"], [style*="rgb(16, 185, 129)"], [style*="#10b981"], [class*="accent"] {
                color: #ffffff !important;
                background-color: #1a1a22 !important;
              }

              /* ESTRUCTURA Y NAVEGACIÓN */
              header, [class*="navbar"], [class*="header"] {
                background: rgba(10, 10, 15, 0.95) !important;
                backdrop-filter: blur(16px) !important;
                border-bottom: 1px solid var(--border-subtle) !important;
              }

              /* TARJETAS DE PAQUETES REDISEÑADAS */
              article, .card, [class*="card"], [class*="pack-card"], [class*="Item"] {
                background: var(--bg-card) !important;
                border: 1px solid var(--border-subtle) !important;
                border-radius: 16px !important;
                transition: transform 0.2s ease, border-color 0.2s ease !important;
              }

              article:hover, .card:hover, [class*="card"]:hover {
                transform: translateY(-4px) !important;
                border-color: #ffffff !important;
              }

              /* BOTONES MINIMALISTAS */
              button, .btn, [class*="button"], [class*="btn"], input[type="submit"] {
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: 800 !important;
                border-radius: 12px !important;
                border: none !important;
                text-transform: uppercase !important;
              }

              /* INPUTS Y BÚSQUEDA REDONDEADA */
              input, select, textarea {
                background: #0f0f14 !important;
                color: #ffffff !important;
                border: 1px solid #27272a !important;
                border-radius: 12px !important;
                padding: 10px 16px !important;
              }

              /* OCULTAR ELEMENTOS NO DESEADOS, TIENDAS, DISCORD Y LOGIN ORIGINAL */
              [href*="discord"], [href*="plus"], [class*="plus"], 
              [class*="owner"], [class*="credits"], [class*="team"],
              [href*="checkout"], [class*="pricing"], [class*="vip"] {
                display: none !important;
              }

              /* MODAL DE LOGIN / REGISTRO PROPIO */
              #keefAuthModal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
              }

              #keefAuthModal.active {
                opacity: 1;
                pointer-events: auto;
              }

              .keef-auth-box {
                background: #0f0f14;
                border: 1px solid #27272a;
                border-radius: 20px;
                padding: 30px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                text-align: center;
              }

              /* FOOTER PERSONALIZADO */
              footer::after {
                content: "KeefPacks © 2026 — Desarrollado & Administrado por 71x7. Todos los derechos reservados." !important;
                display: block !important;
                text-align: center !important;
                padding: 24px !important;
                font-size: 13px !important;
                color: #71717a !important;
                font-weight: 600 !important;
              }
            </style>
          `;

          // --- 2. JAVASCRIPT: MODAL PROPIO + TRADUCCIÓN AGRESIVA AL ESPAÑOL ---
          const customBody = `
            <!-- MODAL PROPIO DE LOGIN / REGISTRO -->
            <div id="keefAuthModal">
              <div class="keef-auth-box">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                  <h3 style="font-weight: 800; font-size: 18px; margin: 0;"><i class="fa-solid fa-user-shield" style="margin-right: 8px;"></i> KeefPacks Cuenta</h3>
                  <button onclick="toggleKeefAuth()" style="background: transparent !important; color: #fff !important; width: auto !important; padding: 0 !important; font-size: 18px; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <p style="font-size: 13px; color: #8e8e93; margin-bottom: 20px;">Inicia sesión o regístrate para acceder a tus paquetes guardados.</p>
                <form onsubmit="event.preventDefault(); alert('Sistema de usuario en mantenimiento por 71x7');" style="display: flex; flex-direction: column; gap: 12px;">
                  <input type="text" placeholder="Usuario o Email" required>
                  <input type="password" placeholder="Contraseña" required>
                  <button type="submit" style="padding: 12px; margin-top: 10px; cursor: pointer;">Entrar a KeefPacks</button>
                </form>
              </div>
            </div>

            <script id="keefpacks-engine">
              document.title = "KEEFPACKS — Texture Packs Vault (Por 71x7)";

              function toggleKeefAuth() {
                const modal = document.getElementById('keefAuthModal');
                modal.classList.toggle('active');
              }

              // REEMPLAZOS TRADUCCIONES EXTREMAS AL ESPAÑOL
              const dictionary = [
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
                [/Login/gi, 'Iniciar Sesión'],
                [/Sign In/gi, 'Iniciar Sesión'],
                [/Sign Up/gi, 'Registrarse'],
                [/Register/gi, 'Registrarse'],
                [/Logout/gi, 'Cerrar Sesión'],
                [/Home/gi, 'Inicio'],
                [/Community/gi, 'Comunidad'],
                [/Settings/gi, 'Ajustes'],
                [/Created by.*/gi, 'Creado por 71x7'],
                [/Developed by.*/gi, 'Propiedad de 71x7'],
                [/Owner.*/gi, 'Propietario: 71x7']
              ];

              function overhaulDOM(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  let text = node.nodeValue;
                  dictionary.forEach(([from, to]) => {
                    text = text.replace(from, to);
                  });
                  node.nodeValue = text;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const href = node.getAttribute('href') || '';
                  
                  // Interceptar redirecciones de Login/Register para usar nuestro modal
                  if (href.includes('login') || href.includes('register') || href.includes('auth') || href.includes('api/auth')) {
                    node.setAttribute('href', '#');
                    node.onclick = (e) => {
                      e.preventDefault();
                      toggleKeefAuth();
                    };
                  }

                  // Ocultar redes o links externos no deseados
                  if (href.includes('discord') || href.includes('twitter') || href.includes('plus')) {
                    node.style.setProperty('display', 'none', 'important');
                    return;
                  }

                  for (let child of node.childNodes) {
                    overhaulDOM(child);
                  }
                }
              }

              window.addEventListener('DOMContentLoaded', () => {
                overhaulDOM(document.body);
              });

              const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                  m.addedNodes.forEach((n) => overhaulDOM(n));
                });
              });

              observer.observe(document.documentElement, { childList: true, subtree: true });
            </script>
          `;

          // Inyección final en el HTML
          html = html.replace('</head>', `${customHead}</head>`);
          html = html.replace('</body>', `${customBody}</body>`);

          return html;
        }

        return responseBuffer;
      }),
    },
  })
);

module.exports = app;
