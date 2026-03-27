// api/youtube.js — AuraLayer YouTube Intelligence endpoint
// Extracts video metadata and transcript from a YouTube URL

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:shorts\/)([a-zA-Z0-9_-]{11})/,
    ];

    let videoId = null;
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) { videoId = match[1]; break; }
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Could not extract video ID from URL' });
    }

    // Fetch video metadata via YouTube oEmbed (no API key needed)
    let title = 'YouTube Video';
    let channel = '';
    let description = '';

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || title;
        channel = oembed.author_name || '';
      }
    } catch (e) {
      console.log('oEmbed fetch failed:', e.message);
    }

    // Try to fetch transcript via YouTube's timedtext API (no key needed for public videos)
    let transcript = '';
    let hasTranscript = false;

    try {
      // First get the video page to find available caption tracks
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AuraLayer/1.0)',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        // Extract description from page
        const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        if (descMatch) {
          description = descMatch[1]
            .replace(/\\n/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .substring(0, 600);
        }

        // Find caption tracks
        const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
        if (captionMatch) {
          const tracksStr = captionMatch[1];
          // Prefer English, fall back to first available
          const enMatch = tracksStr.match(/"baseUrl":"(https:[^"]+)","name".*?"languageCode":"en"/)
            || tracksStr.match(/"baseUrl":"(https:[^"]+)"/);

          if (enMatch) {
            const captionUrl = enMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            const captionRes = await fetch(captionUrl);
            if (captionRes.ok) {
              const xml = await captionRes.text();
              // Strip XML tags and decode entities
              transcript = xml
                .replace(/<[^>]+>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 2000);
              hasTranscript = transcript.length > 50;
            }
          }
        }
      }
    } catch (e) {
      console.log('Transcript fetch failed:', e.message);
    }

    return res.status(200).json({
      videoId,
      title,
      channel,
      description,
      transcript,
      hasTranscript,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    });

  } catch (err) {
    console.error('YouTube handler error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process YouTube URL' });
  }
}
