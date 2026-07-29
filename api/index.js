const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9'
};

// API 1: Obtener Packs y Buscador Real (Extracción de Next.js JSON)
app.get('/api/packs', async (req, res) => {
  try {
    const search = req.query.q || '';
    const targetUrl = search 
      ? `https://packsmc.com/search?q=${encodeURIComponent(search)}`
      : `https://packsmc.com/packs`;

    const response = await axios.get(targetUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const packs = [];

    // 1. Extraer los datos reales del script comprimido de Next.js
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (nextDataScript) {
      const parsedData = JSON.parse(nextDataScript);
      const pageProps = parsedData.props?.pageProps || {};
      
      // Buscar la lista de packs en las props
      const rawPacks = pageProps.packs || pageProps.searchResults || pageProps.initialPacks || [];

      rawPacks.forEach(pack => {
        packs.push({
          id: pack.slug || pack.id || pack._id,
          title: (pack.name || pack.title || 'Pack sin nombre').replace(/PacksMC/gi, 'KeefPacks'),
          image: pack.icon || pack.thumbnail || pack.image || 'https://picsum.photos/400/225',
          resolution: pack.resolution || pack.category || '16x',
          downloadUrl: `/api/download/${pack.slug || pack.id}`
        });
      });
    }

    // 2. Fallback de emergencia si Next.js cambia la estructura
    if (packs.length === 0) {
      $('a[href*="/pack/"]').each((i, el) => {
        const link = $(el).attr('href') || '';
        const title = $(el).text().trim() || 'Pack de Recursos';
        const img = $(el).find('img').attr('src') || '';
        const packId = link.split('/').pop();

        if (packId && !packs.some(p => p.id === packId)) {
          packs.push({
            id: packId,
            title: title.replace(/PacksMC/gi, 'KeefPacks'),
            image: img.startsWith('http') ? img : `https://packsmc.com${img}`,
            resolution: 'Resource',
            downloadUrl: `/api/download/${packId}`
          });
        }
      });
    }

    res.json({ success: true, count: packs.length, packs });
  } catch (error) {
    console.error("Error scraping PacksMC:", error.message);
    res.status(500).json({ success: false, message: "Error al conectar con la base de datos." });
  }
});

// API 2: Descarga Directa
app.get('/api/download/:id', async (req, res) => {
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
      fileUrl = packDetails.downloadUrl || packDetails.fileUrl || packDetails.directLink;
    }

    if (!fileUrl) {
      fileUrl = $('a[href*=".zip"]').attr('href') || $('a[href*="download"]').attr('href');
    }

    if (!fileUrl) {
      return res.redirect(`https://packsmc.com/pack/${packId}`);
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
    res.status(500).send('Error al procesar la descarga directa.');
  }
});

module.exports = app;
