// api/discord-waitlist.js
// Vercel serverless function — receives Discord waitlist signups and sends via Resend
// Environment variable required: RESEND_API_KEY (set in Vercel dashboard)
// Deploy: drop this file into /api/ folder in your GitHub repo root

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. Send confirmation email to the person who signed up
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AuraLayer <support@auralayer.ai>',
        to: [email],
        subject: "You're on the AuraLayer Discord waitlist 🔥",
        html: `
          <div style="background:#0A0A0F;color:#F5F3EE;font-family:'DM Sans',sans-serif;padding:48px 32px;max-width:520px;margin:0 auto;">
            <div style="margin-bottom:32px;">
              <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:300;">
                <span style="color:#F5F3EE;">Aura</span><span style="color:#C9922A;">Layer</span><span style="color:#C9922A;font-size:14px;">.ai</span>
              </span>
            </div>
            <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:#F5F3EE;margin-bottom:16px;line-height:1.1;">
              You're on the list.
            </h1>
            <p style="font-size:15px;color:#A8A49A;line-height:1.8;margin-bottom:24px;">
              We're putting the finishing touches on the AuraLayer creator community. When the doors open, you'll be the first to know.
            </p>
            <p style="font-size:15px;color:#A8A49A;line-height:1.8;margin-bottom:32px;">
              In the meantime — if you haven't tried the app yet, there's no better time:
            </p>
            <a href="https://auralayer.ai/app" style="display:inline-block;background:#C9922A;color:#0A0A0F;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
              ✦ &nbsp; Try AuraLayer Free →
            </a>
            <p style="font-size:12px;color:#5A5750;margin-top:40px;">
              © 2026 AuraLayer.ai · You're receiving this because you joined the Discord waitlist.
            </p>
          </div>
        `
      })
    });

    // 2. Notify Manny that someone joined the waitlist
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AuraLayer Waitlist <support@auralayer.ai>',
        to: ['tvchpoint@gmail.com'],
        subject: `🔥 New Discord waitlist signup: ${email}`,
        html: `
          <p style="font-family:sans-serif;font-size:15px;">
            <strong>${email}</strong> just joined the AuraLayer Discord waitlist.
          </p>
          <p style="font-family:sans-serif;font-size:13px;color:#666;">
            Source: auralayer.ai/discord
          </p>
        `
      })
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
