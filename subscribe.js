export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing config' });
  }

  try {
    // 1. Add to Resend audience (if audience ID is configured)
    if (AUDIENCE_ID) {
      await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    }

    // 2. Send notification email to support@auralayer.ai
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AuraLayer <support@auralayer.ai>',
        to: 'support@auralayer.ai',
        subject: `[AuraLayer Lead] ${email}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <div style="background:#0A0A0F;border-radius:12px;padding:24px;color:#F0EDE4;">
              <div style="font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">New Lead Captured</div>
              <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${email}</div>
              <div style="font-size:12px;color:rgba(240,237,228,0.4);">${now} ET</div>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0;">
              <div style="font-size:11px;color:rgba(240,237,228,0.4);">Submitted via post-generation email capture · auralayer.ai/app</div>
            </div>
          </div>
        `,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
