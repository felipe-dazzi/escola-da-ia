/**
 * Proxy de vídeo VTurb/ConverteAI
 * Adiciona o header Referer necessário para acessar os arquivos
 */
export default async function handler(req, res) {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // Validar que é do domínio permitido
  if (!url.startsWith('https://cdn.converteai.net/e27a5abd-08c6-448d-a8ab-8d3afef5259f/')) {
    return res.status(403).json({ error: 'Invalid domain' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://escoladaia.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Set content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Proxy the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}