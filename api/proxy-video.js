/**
 * Proxy de vídeo VTurb/ConverteAI
 * Adiciona o header Referer necessário e reescreve URLs relativas no m3u8
 */
const BASE_CDN = 'https://cdn.converteai.net/e27a5abd-08c6-448d-a8ab-8d3afef5259f';

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // Validar que é do domínio permitido
  if (!url.startsWith(BASE_CDN)) {
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
    
    const contentType = response.headers.get('content-type') || '';

    // Se for m3u8, reescrever URLs relativas para absolutas via proxy
    if (contentType.includes('mpegURL') || contentType.includes('x-mpegurl') || url.endsWith('.m3u8')) {
      let text = await response.text();
      
      // Determinar o diretório base da URL atual
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const proxyBase = '/api/proxy-video?url=';
      
      // Reescrever linhas que são caminhos relativos (não começam com #, não são URLs absolutas)
      const lines = text.split('\n');
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        // Linhas que são URLs relativas (não começam com #, http://, https://, ou são vazias)
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          const absoluteUrl = baseUrl + trimmed;
          return proxyBase + encodeURIComponent(absoluteUrl);
        }
        return line;
      }).join('\n');
      
      res.setHeader('Content-Type', 'application/x-mpegURL');
      return res.send(rewritten);
    }

    // Para arquivos .ts (segmentos de vídeo), fazer streaming direto
    res.setHeader('Content-Type', contentType || 'video/MP2T');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}