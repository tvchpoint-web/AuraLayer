// api/generate.js — AuraLayer
// IMPORTANT: This handler passes the system prompt EXACTLY as received from the client.
// Do NOT add or override the system prompt here — language instructions live in the client.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { model, max_tokens, system, messages, userKeys } = body;

    // Log incoming system prompt prefix for debugging (first 120 chars)
    console.log('[generate] system prefix:', (system||'').substring(0, 120));
    console.log('[generate] user msg prefix:', (messages?.[0]?.content||'').substring(0, 120));

    // Use user's own Anthropic key if provided, else env key
    const apiKey = (userKeys?.anthropic?.startsWith('sk-ant-'))
      ? userKeys.anthropic
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'No API key configured' });
    }

    // Build Anthropic request — pass system and messages exactly as received
    const anthropicBody = {
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1200,
      messages: messages,
    };

    // Pass system prompt through unchanged — this contains language instructions
    if (system && system.trim().length > 0) {
      anthropicBody.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[generate] Anthropic error:', data);
      return res.status(response.status).json({ error: data.error || 'Anthropic API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[generate] Handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
