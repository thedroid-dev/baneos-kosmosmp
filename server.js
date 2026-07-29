const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://packsmc.com',
    changeOrigin: true,
    selfHandleResponse: true, // Permite modificar la respuesta antes de enviarla
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        // Eliminamos las cabeceras que bloquean la visualización
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];

        // Si la respuesta es HTML, reescribimos los textos y marcas
        const contentType = proxyRes.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          let responseText = responseBuffer.toString('utf8');
          
          // Reemplazos de marca
          responseText = responseText.replace(/PacksMC/g, 'KOSMOS PACKS');
          responseText = responseText.replace(/packsmc\.com/g, req.headers.host);

          return responseText;
        }

        // Para CSS, JS e imágenes, devuelve el buffer original intacto
        return responseBuffer;
      }),
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://packsmc.com/'
    }
  })
);

app.listen(PORT, () => {
  console.log(`Servidor Kosmos Packs en puerto ${PORT}`);
});
