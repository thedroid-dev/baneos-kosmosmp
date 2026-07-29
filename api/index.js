const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9'
};

// Servir la web estática
app.use(express.static(path.join(__dirname, '../public')));

// API 1: Obtener Packs y Buscador en tiempo real
app.get('/api/packs', async (req, res) => {
  try {
    const search = req.query.q || '';
    const page = req.query.page || 1;
    const targetUrl = search 
      ? `https://packsmc.com/search?q=${encodeURIComponent(search)}&page=${page}`
      : `https://packsmc.com/packs?page=${page}`;

    const response = await axios.get(targetUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const packs = [];

    // Extracción dinámica de las tarjetas
    $('article, [class*="pack-card"], [class*="Card"]').each((i, el) => {
      const title = $(el).find('h2, h3, [class*="title"]').first().text().trim();
      const link = $(el).find('a').first().attr('href') || '';
      const img = $(el).find('img').first().attr('src') || '';
      const badge = $(el).find('[class*="badge"], [class*="tag"]').first().text().trim() || '16x';
      
      const packId = link.replace('/pack/', '').replace('/packs/', '');

      if (title && packId) {
        packs.push({
          id: packId,
          title: title.replace(/PacksMC/gi, 'KeefPacks'),
          image: img.startsWith('http') ? img : `https://packsmc.com${img}`,
          resolution: badge,
          downloadUrl: `/api/download/${packId}`
        });
      }
    });

    res.json({ success: true, packs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener packs de la base de datos." });
  }
});

// API 2: Descarga Directa Forzada (Sin Redirecciones Externas)
app.get('/api/download/:id', async (req, res) => {
  try {
    const packId = req.params.id;
    const packPageUrl = `https://packsmc.com/pack/${packId}`;
    
    // 1. Obtenemos la página del pack
    const pageRes = await axios.get(packPageUrl, { headers: HEADERS });
    const $ = cheerio.load(pageRes.data);
    
    // 2. Buscamos el enlace real del archivo .zip
    let fileUrl = $('a[href*=".zip"]').attr('href') || $('a[href*="download"]').attr('href');

    if (!fileUrl) {
      return res.status(404).send('Archivo de descarga no encontrado.');
    }

    if (!fileUrl.startsWith('http')) {
      fileUrl = `https://packsmc.com${fileUrl}`;
    }

    // 3. Descargamos el archivo en segundo plano y se lo enviamos directamente al usuario
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
