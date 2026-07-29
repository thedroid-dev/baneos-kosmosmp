const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9'
};

// API: Obtener lista de packs y resultados de búsqueda reales
router.get('/packs', async (req, res) => {
  try {
    const search = req.query.q || '';
    const targetUrl = search 
      ? `https://packsmc.com/search?q=${encodeURIComponent(search)}`
      : `https://packsmc.com/packs`;

    const response = await axios.get(targetUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const packs = [];

    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      const parsedData = JSON.parse(nextDataScript);
      const pageProps = parsedData.props?.pageProps || {};
      const rawPacks = pageProps.packs || pageProps.searchResults || pageProps.initialPacks || [];

      rawPacks.forEach(pack => {
        packs.push({
          id: pack.slug || pack.id,
          title: (pack.name || pack.title || 'Pack sin nombre').replace(/PacksMC/gi, 'KeefPacks'),
          image: pack.icon || pack.thumbnail || pack.image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500',
          resolution: pack.resolution || pack.category || '16x',
          downloadUrl: `/api/download/${pack.slug || pack.id}`
        });
      });
    }

    res.json({ success: true, packs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener los datos." });
  }
});

// API: Descarga directa oculta (Sin redireccionar a su web)
router.get('/download/:id', async (req, res) => {
  try {
    const packId = req.params.id;
    const packPageUrl = `https://packsmc.com/pack/${packId}`;
    
    const pageRes = await axios.get(packPageUrl, { headers: HEADERS });
    const $ = cheerio.load(pageRes.data);
    
    let fileUrl = '';
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (nextDataScript) {
      const parsedData = JSON.parse(nextDataScript);
      const packDetails = parsedData.props?.pageProps?.pack || {};
      fileUrl = packDetails.downloadUrl || packDetails.fileUrl;
    }

    if (!fileUrl) {
      fileUrl = $('a[href*=".zip"]').attr('href');
    }

    if (!fileUrl) {
      return res.status(404).send('Enlace de descarga no disponible.');
    }

    if (!fileUrl.startsWith('http')) {
      fileUrl = `https://packsmc.com${fileUrl}`;
    }

    const fileStream = await axios.get(fileUrl, {
      headers: HEADERS,
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', `attachment; filename="KeefPacks_${packId}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    fileStream.data.pipe(res);

  } catch (error) {
    res.status(500).send('Error al procesar la descarga.');
  }
});

app.use('/api', router);
module.exports.handler = serverless(app);
