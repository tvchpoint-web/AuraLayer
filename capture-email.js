// api/capture-email.js
// Vercel Serverless Function — AuraLayer email gate capture
// Receives: { email, source, blend }
// Actions:  1) Add contact to Resend audience
//           2) Send welcome email via Resend
//           3) Return 200 (always — silent fail on client)

const RESEND_API_KEY  = process.env.RESEND_API_KEY;   // set in Vercel env vars
const RESEND_AUDIENCE = process.env.RESEND_AUDIENCE_ID; // optional — Resend audience ID
const FROM_EMAIL      = 'Manny at AuraLayer <support@auralayer.ai>';

export default async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', 'https://auralayer.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // ── PARSE ──
  const { email, source = 'email_gate', blend = '' } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const emailLower = email.trim().toLowerCase();

  // ── ADD TO RESEND AUDIENCE (optional) ──
  if (RESEND_API_KEY && RESEND_AUDIENCE) {
    try {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          unsubscribed: false,
          data: { source, blend },
        }),
      });
    } catch (_) {
      // silent — don't block the welcome email
    }
  }

  // ── SEND WELCOME EMAIL ──
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: emailLower,
          subject: 'Your AuraLayer blend is saved ✦',
          html: buildWelcomeEmail(blend),
        }),
      });
    } catch (_) {
      // silent
    }
  }

  return res.status(200).json({ ok: true });
}

// ── EMAIL TEMPLATE ──
function buildWelcomeEmail(blend) {
  const blendLine = blend ? `<p style="font-size:14px;color:#555;margin:0 0 24px;">Your blend: <strong style="color:#C9922A;">${blend}</strong></p>` : '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5EFE4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE4;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#111111;padding:28px 32px;">
          <p style="margin:0;font-size:11px;letter-spacing:2px;color:#C9922A;font-family:monospace;text-transform:uppercase;">AuraLayer.ai</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#FFFFFF;line-height:1.3;">Your blend is saved. ✦</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          ${blendLine}
          <p style="font-size:15px;color:#111;line-height:1.7;margin:0 0 20px;">
            You've got one more free generation waiting. Head back to the app and run it — your percentages are already loaded.
          </p>
          <a href="https://auralayer.ai/app" style="display:block;text-align:center;background:#C9922A;color:#FFFFFF;font-weight:800;font-size:15px;padding:16px 24px;border-radius:14px;text-decoration:none;margin-bottom:28px;">
            Run gen 2 → auralayer.ai/app
          </a>
          <p style="font-size:13px;color:#888;line-height:1.7;margin:0 0 16px;">
            After gen 2, you'll unlock the full platform — unlimited blends, all tools, advanced modes. Beta pricing locks on <strong>April 30</strong>.
          </p>
          <p style="font-size:13px;color:#888;line-height:1.7;margin:0;">
            — Manny A.<br>
            <span style="font-size:11px;color:#aaa;">Founder, AuraLayer.ai</span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #F0EDE6;">
          <p style="margin:0;font-size:10px;color:#aaa;font-family:monospace;letter-spacing:.5px;">
            AuraLayer.ai · Same AI tools. Your voice. Every time.<br>
            You're receiving this because you signed up at auralayer.ai/aura-check.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
