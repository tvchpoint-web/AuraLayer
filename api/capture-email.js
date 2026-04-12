// api/capture-email.js
// Vercel Serverless Function — AuraLayer email gate capture
// Receives: { email, source, blend }
// Actions:  1) Add contact to Loops + trigger drip
//           2) Send instant welcome email via Resend
//           3) Return 200 always

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const LOOPS_API_KEY  = process.env.LOOPS_API_KEY;
const FROM_EMAIL     = 'Manny at AuraLayer <support@auralayer.ai>';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://auralayer.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { email, source = 'email_gate', blend = '' } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  const emailLower = email.trim().toLowerCase();

  // 1. ADD TO LOOPS + TRIGGER DRIP
  if (LOOPS_API_KEY) {
    try {
      await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: { 'Authorization': `ApiKey ${LOOPS_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower, source, blendName: blend, userGroup: 'beta' }),
      });
      await fetch('https://app.loops.so/api/v1/events/send', {
        method: 'POST',
        headers: { 'Authorization': `ApiKey ${LOOPS_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower, eventName: 'email_gate', eventProperties: { blendName: blend, source } }),
      });
    } catch (_) {}
  }

  // 2. INSTANT WELCOME via Resend
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: emailLower, subject: 'Your AuraLayer blend is saved ✦', html: buildWelcomeEmail(blend) }),
      });
    } catch (_) {}
  }

  return res.status(200).json({ ok: true });
}

function buildWelcomeEmail(blend) {
  const blendPill = blend ? `<p style="margin:0 0 16px;display:inline-block;font-family:'Courier New',monospace;font-size:11px;color:#C9922A;background:rgba(201,146,42,0.1);border:1px solid rgba(201,146,42,0.28);border-radius:8px;padding:7px 12px;">✦ ${blend}</p><br>` : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5EFE4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FAF6EF;border-radius:16px;overflow:hidden;border:1px solid rgba(201,146,42,0.28);">
        <!-- HEADER -->
        <tr><td style="padding:24px 28px 20px;border-bottom:2px solid #C9922A;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:8px;vertical-align:middle;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:3px;"><div style="width:22px;height:4px;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9922A);"></div></td></tr>
                <tr><td style="padding-bottom:3px;"><div style="width:16px;height:4px;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9922A);opacity:0.65;"></div></td></tr>
                <tr><td><div style="width:10px;height:4px;border-radius:10px;background:#A07518;opacity:0.35;"></div></td></tr>
              </table>
            </td>
            <td style="vertical-align:middle;"><span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#111111;">Aura</span><span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#C9922A;">Layer</span><span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#C9922A;">.ai</span></td>
          </tr></table>
          <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#111111;line-height:1.3;">Your blend is saved. ✦</p>
        </td></tr>
        <!-- BODY -->
        <tr><td style="padding:24px 28px;">
          ${blendPill}
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:rgba(17,17,17,0.7);">You've got one more free generation waiting. Your exact percentages are already loaded.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
            <tr><td align="center"><a href="https://auralayer.ai/app" style="display:inline-block;background:#C9922A;color:#1A1208;font-family:Georgia,serif;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">Run gen 2 → auralayer.ai/app</a></td></tr>
          </table>
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;color:rgba(17,17,17,0.5);line-height:1.7;">After gen 2 you'll see the full platform — unlimited blends, all tools, advanced modes. Beta pricing locks <strong style="color:#111111;">April 30</strong>.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(17,17,17,0.5);line-height:1.7;"><strong style="color:#111111;">— Manny A.</strong><br>Founder, AuraLayer.ai</p>
        </td></tr>
        <!-- FOOTER -->
        <tr><td style="padding:14px 28px;border-top:1px solid rgba(201,146,42,0.2);">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;"><tr>
            <td style="padding-right:8px;vertical-align:middle;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:3px;"><div style="width:16px;height:3px;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9922A);"></div></td></tr>
                <tr><td style="padding-bottom:3px;"><div style="width:11px;height:3px;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9922A);opacity:0.65;"></div></td></tr>
                <tr><td><div style="width:7px;height:3px;border-radius:10px;background:#A07518;opacity:0.35;"></div></td></tr>
              </table>
            </td>
            <td><span style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#111111;">Aura</span><span style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#C9922A;">Layer</span><span style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#C9922A;">.ai</span></td>
          </tr></table>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:.5px;color:rgba(17,17,17,0.35);">Same AI tools. Your voice. Every time.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
