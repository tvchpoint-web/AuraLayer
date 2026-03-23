export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, fname } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  const DC = API_KEY.split('-')[1]; // e.g. 'us4'

  const url = `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`anystring:${API_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: fname || '',
        },
        tags: ['beta-signup', 'landing-page'],
      }),
    });

    const data = await response.json();

    // Member already exists is fine — treat as success
    if (response.ok || data.title === 'Member Exists') {
      return res.status(200).json({ success: true });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Mailchimp error:', error);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}
