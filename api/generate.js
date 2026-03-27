// api/generate.js — AuraLayer Vercel API handler
// Passes system prompt from client through to Anthropic unchanged
// Supports user-supplied API keys

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, max_tokens, system, messages, userKeys } = req.body;

    // Use user's Anthropic key if provided, otherwise fall back to env key
    const anthropicKey = (userKeys?.anthropic && userKeys.anthropic.startsWith('sk-ant-'))
      ? userKeys.anthropic
      : process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      return res.status(500).json({ error: 'No Anthropic API key configured' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Build request body — pass system prompt exactly as received from client
    const body = {
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1200,
      messages,
    };

    // Only add system if provided — this is where language instruction lives
    if (system) {
      body.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error || 'Anthropic API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
