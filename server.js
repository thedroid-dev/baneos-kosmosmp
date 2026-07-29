const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(async (req, res) => {
    try {
        const targetUrl = `https://packsmc.com${req.url}`;
        
        // Obtenemos el contenido de PacksMC simulando ser un navegador real
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9'
            },
            responseType: 'arraybuffer'
        });

        let content = response.data.toString('utf-8');

        // Reemplazamos la marca PacksMC por KOSMOS PACKS en todo el HTML
        content = content.replace(/PacksMC/g, 'KOSMOS PACKS');
        content = content.replace(/packsmc\.com/g, req.headers.host);

        // Eliminamos las cabeceras que bloquean el sitio
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        
        res.send(content);
    } catch (error) {
        res.status(500).send('Error al conectar con la red de KOSMOS PACKS');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Kosmos Packs corriendo en el puerto ${PORT}`);
});
