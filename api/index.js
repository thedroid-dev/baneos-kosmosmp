const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy transparente únicamente para datos y API
app.use(
  '/api-proxy',
  createProxyMiddleware({
    target: 'https://packsmc.com',
    changeOrigin: true,
    pathRewrite: { '^/api-proxy': '' },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Host', 'packsmc.com');
        proxyReq.setHeader('Referer', 'https://packsmc.com/');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36');
      }
    }
  })
);

module.exports = app;
