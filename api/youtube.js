export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    // Extract video ID from any YouTube URL format
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (!match) return res.status(400).json({ error: 'Invalid YouTube URL' });
    const videoId = match[1];

    // Fetch video page to extract metadata
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraLayer/1.0)' }
    });
    const html = await pageRes.text();

    // Extract title
    const titleMatch = html.match(/"title":"([^"]+)"/);
    const title = titleMatch
      ? titleMatch[1].replace(/\\u0026/g, '&').replace(/\\n/g, ' ')
      : 'YouTube Video';

    // Extract description snippet
    const descMatch = html.match(/"shortDescription":"([^"]{0,500})/);
    const description = descMatch
      ? descMatch[1].replace(/\\n/g, ' ').replace(/\\u0026/g, '&')
      : '';

    // Extract channel name
    const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
    const channel = channelMatch ? channelMatch[1] : '';

    // Try to get captions/transcript
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    let transcript = '';

    if (captionMatch) {
      try {
        const captions = JSON.parse(captionMatch[1]);
        const engCaption =
          captions.find(c => c.languageCode === 'en' || c.languageCode === 'en-US') ||
          captions[0];

        if (engCaption?.baseUrl) {
          const captRes = await fetch(engCaption.baseUrl);
          const captXml = await captRes.text();
          const textMatches = captXml.match(/<text[^>]*>([^<]*)<\/text>/g) || [];
          transcript = textMatches
            .map(t =>
              t.replace(/<[^>]+>/g, '')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&#39;/g, "'")
               .replace(/&quot;/g, '"')
            )
            .join(' ')
            .substring(0, 3000);
        }
      } catch (e) {
        console.log('Caption fetch failed:', e.message);
      }
    }

    return res.status(200).json({
      videoId,
      title,
      channel,
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
