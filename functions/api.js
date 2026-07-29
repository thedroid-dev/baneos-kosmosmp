const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

router.get('/packs', async (req, res) => {
  try {
    const search = req.query.q || '';
    const targetUrl = search 
      ? `https://packsmc.com/search?q=${encodeURIComponent(search)}`
      : `https://packsmc.com/packs`;

    // Usando headers avanzados para simular un navegador real
    const response = await axios.get(targetUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 8000 
    });

    const $ = cheerio.load(response.data);
    const packs = [];

    // Extracción profunda de las tarjetas publicadas por la gente
    $('a[href*="/pack/"]').each((i, el) => {
      const link = $(el).attr('href') || '';
      const packId = link.split('/').pop();
      const title = $(el).find('h2, h3, .font-bold, span').first().text().trim() || $(el).text().trim();
      const img = $(el).find('img').attr('src') || '';

      if (packId && title && title.length > 2 && !packs.some(p => p.id === packId)) {
        packs.push({
          id: packId,
          title: title.replace(/PacksMC/gi, 'KeefPacks').substring(0, 45),
          image: img.startsWith('http') ? img : (img ? `https://packsmc.com${img}` : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500'),
          resolution: '16x / 32x',
          downloadUrl: `/api/download/${packId}`
        });
      }
    });

    res.json({ success: true, count: packs.length, packs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Protección anti-bot detectada. Intenta recargar en unos segundos." });
  }
});

router.get('/download/:id', async (req, res) => {
  const packId = req.params.id;
  res.redirect(`https://packsmc.com/pack/${packId}`);
});

app.use('/api', router);
module.exports.handler = serverless(app);
