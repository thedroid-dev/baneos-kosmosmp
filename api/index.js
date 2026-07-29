
const https = require('https');
const zlib = require('zlib');

module.exports = (req, res) => {
  const options = {
    hostname: 'packsmc.com',
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      'Host': 'packsmc.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let chunks = [];

    proxyRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    proxyRes.on('end', () => {
      let buffer = Buffer.concat(chunks);
      const contentType = proxyRes.headers['content-type'] || '';

      // Si es HTML, inyectamos nuestro diseño y marca
      if (contentType.includes('text/html')) {
        const encoding = proxyRes.headers['content-encoding'];

        const processHtml = (htmlString) => {
          // Inyección de Estilos y Reemplazo de Marca
          const customStyle = `
            <style>
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
                content: "KeefPacks © 2026 — Desarrollado por 71x7" !important;
                display: block !important;
                text-align: center !important;
                padding: 20px !important;
                color: #71717a !important;
                font-size: 12px !important;
              }
            </style>
            <script>
              document.title = "KEEFPACKS — Texture Packs (por 71x7)";
            </script>
          `;

          let modified = htmlString.replace(/PacksMC/gi, 'KeefPacks').replace(/PackMC/gi, 'KeefMC');
          modified = modified.replace('</head>', `${customStyle}</head>`);
          return modified;
        };

        // Manejar compresión Gzip / Deflate si el servidor original la envía
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return sendRaw(proxyRes, buffer);
            const modifiedHtml = processHtml(decoded.toString('utf8'));
            zlib.gzip(modifiedHtml, (err, compressed) => {
              if (err) return sendRaw(proxyRes, buffer);
              sendResponse(proxyRes, compressed, 'gzip');
            });
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return sendRaw(proxyRes, buffer);
            const modifiedHtml = processHtml(decoded.toString('utf8'));
            zlib.deflate(modifiedHtml, (err, compressed) => {
              if (err) return sendRaw(proxyRes, buffer);
              sendResponse(proxyRes, compressed, 'deflate');
            });
          });
        } else {
          const modifiedHtml = processHtml(buffer.toString('utf8'));
          sendResponse(proxyRes, Buffer.from(modifiedHtml), null);
        }
      } else {
        // Archivos estáticos (imágenes, zip de descargas, CSS, JS) se envían directos
        sendRaw(proxyRes, buffer);
      }
    });
  });

  proxyReq.on('error', (err) => {
    res.statusCode = 500;
    res.end('Error interno en el servidor proxy.');
  });

  req.pipe(proxyReq);
};

function sendResponse(proxyRes, bodyBuffer, encoding) {
  const headers = { ...proxyRes.headers };
  headers['content-length'] = bodyBuffer.length;
  if (encoding) headers['content-encoding'] = encoding;
  else delete headers['content-encoding'];
  
  delete headers['content-security-policy'];
  delete headers['x-frame-options'];

  proxyRes.socket.server?.res?.writeHead?.(proxyRes.statusCode, headers);
}

function sendRaw(proxyRes, buffer) {
  const headers = { ...proxyRes.headers };
  delete headers['content-security-policy'];
  delete headers['x-frame-options'];
  // Nota: se usa la respuesta del objeto global manejada por Vercel
}
