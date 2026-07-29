const https = require('https');
const zlib = require('zlib');

exports.handler = async function(event, context) {
  const path = event.path || '/';
  const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
  const targetPath = path + queryString;

  return new Promise((resolve) => {
    const options = {
      hostname: 'packsmc.com',
      port: 443,
      path: targetPath,
      method: event.httpMethod,
      headers: {
        'Host': 'packsmc.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };

    const req = https.request(options, (res) => {
      let chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';

        // Limpieza de headers de seguridad restrictivos
        const responseHeaders = { ...res.headers };
        delete responseHeaders['content-security-policy'];
        delete responseHeaders['x-frame-options'];

        if (contentType.includes('text/html')) {
          const encoding = res.headers['content-encoding'];

          const processHtml = (htmlString) => {
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

            let modified = htmlString.replace(/PacksMC/gi, 'KeefPacks').replace(/PackMC/gi, 'KeefMC');
            modified = modified.replace('</head>', `${customStyle}</head>`);
            return modified;
          };

          if (encoding === 'gzip') {
            zlib.gunzip(buffer, (err, decoded) => {
              if (err) return resolve({ statusCode: res.statusCode, headers: responseHeaders, body: buffer.toString('base64'), isBase64Encoded: true });
              const modifiedHtml = processHtml(decoded.toString('utf8'));
              zlib.gzip(modifiedHtml, (err, compressed) => {
                if (err) return resolve({ statusCode: res.statusCode, headers: responseHeaders, body: buffer.toString('base64'), isBase64Encoded: true });
                responseHeaders['content-encoding'] = 'gzip';
                resolve({ statusCode: res.statusCode, headers: responseHeaders, body: compressed.toString('base64'), isBase64Encoded: true });
              });
            });
          } else {
            const modifiedHtml = processHtml(buffer.toString('utf8'));
            resolve({ statusCode: res.statusCode, headers: responseHeaders, body: modifiedHtml });
          }
        } else {
          // Archivos estáticos o descargas directas de .zip
          resolve({
            statusCode: res.statusCode,
            headers: responseHeaders,
            body: buffer.toString('base64'),
            isBase64Encoded: true
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ statusCode: 500, body: 'Error interno en Netlify Function.' });
    });

    if (event.body) {
      req.write(event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body);
    }
    req.end();
  });
};
                
