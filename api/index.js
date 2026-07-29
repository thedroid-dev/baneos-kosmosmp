const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'https://packsmc.com',
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Host', 'packsmc.com');
    proxyReq.setHeader('Referer', 'https://packsmc.com/');
    proxyReq.setHeader('Origin', 'https://packsmc.com');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    proxyReq.setHeader('Accept-Encoding', 'identity');
  },
  onProxyRes: async (proxyRes, req, res) => {
    let body = [];
    proxyRes.on('data', (chunk) => body.push(chunk));
    proxyRes.on('end', () => {
      let buffer = Buffer.concat(body);
      
      // Limpiar headers de seguridad que bloquean la vista
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['x-frame-options'];

      const contentType = proxyRes.headers['content-type'] || '';

      if (contentType.includes('text/html')) {
        let html = buffer.toString('utf8');

        // INYECCIÓN DE TUS ESTILOS Y MARCA (KEEFPACKS / 71x7)
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

        html = html.replace('</head>', `${customStyle}</head>`);
        
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(html);
      } else {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(buffer);
      }
    });
  }
});

module.exports = (req, res) => {
  return proxy(req, res);
};
