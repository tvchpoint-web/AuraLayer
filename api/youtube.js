export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (!match) return res.status(400).json({ error: 'Invalid YouTube URL' });
    const videoId = match[1];

    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await pageRes.text();

    // Extract title — multiple patterns, skip pure numbers
    let title = 'YouTube Video';
    const titlePatterns = [
      /"og:title" content="([^"]+)"/,
      /<title>([^<]+)<\/title>/,
      /"videoDetails":\{[^}]*"title":"([^"]+)"/,
      /"name":"([^"]{10,100})","description"/,
    ];
    for (const pattern of titlePatterns) {
      const m = html.match(pattern);
      if (m && m[1] && m[1].length > 3 && !/^\d+$/.test(m[1].trim())) {
        title = m[1].replace(/\\u0026/g, '&').replace(/\\n/g, ' ').replace(/ - YouTube$/, '').trim();
        break;
      }
    }

    // Extract description
    const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    const description = descMatch
      ? descMatch[1].replace(/\\n/g, ' ').replace(/\\u0026/g, '&').replace(/\\"/g, '"')
      : '';

    // Extract channel name
    let channel = '';
    for (const pattern of [/"ownerChannelName":"([^"]+)"/, /"author":"([^"]+)"/, /"channelName":"([^"]+)"/]) {
      const m = html.match(pattern);
      if (m && m[1]) { channel = m[1]; break; }
    }

    // Try captions/transcript
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    let transcript = '';
    if (captionMatch) {
      try {
        const captions = JSON.parse(captionMatch[1]);
        const engCaption = captions.find(c => c.languageCode === 'en' || c.languageCode === 'en-US') || captions[0];
        if (engCaption?.baseUrl) {
          const captRes = await fetch(engCaption.baseUrl);
          const captXml = await captRes.text();
          transcript = (captXml.match(/<text[^>]*>([^<]*)<\/text>/g) || [])
            .map(t => t.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"'))
            .join(' ')
            .substring(0, 3000);
        }
      } catch (e) { console.log('Caption fetch failed:', e.message); }
    }

    return res.status(200).json({
      videoId, title, channel,
      description: description.substring(0, 300),
      transcript: transcript || '',
      hasTranscript: transcript.length > 0,
      url: `https://youtube.com/watch?v=${videoId}`
    });
  } catch (error) {
    console.error('YouTube error:', error);
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
}
