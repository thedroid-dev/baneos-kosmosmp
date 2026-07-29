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
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        // Eliminamos las cabeceras que obligan compresión y seguridad bloqueante
        delete proxyRes.headers['content-encoding'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        const contentType = proxyRes.headers['content-type'] || '';

        // Si es HTML, reemplazamos la marca a KOSMOS PACKS
        if (contentType.includes('text/html')) {
          let html = responseBuffer.toString('utf8');
          html = html.replace(/PacksMC/g, 'KOSMOS PACKS');
          html = html.replace(/packsmc\.com/g, req.headers.host);
          return html;
        }

        return responseBuffer;
      }),
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Encoding': 'identity', // <--- ESTO ELIMINA LOS SÍMBOLOS RARS (Desactiva GZIP)
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': 'https://packsmc.com/'
    }
  })
);

module.exports = app;
