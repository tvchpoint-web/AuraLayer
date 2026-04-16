// api/capture-email.js
// Vercel Serverless Function — AuraLayer email gate capture
// Receives: { email, source, blend }
// Actions:  1) Add contact to Loops
//           2) Send instant welcome email to user via Resend
//           3) Send instant notification email to Manny via Resend
//           4) Return 200 always

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const LOOPS_API_KEY  = process.env.LOOPS_API_KEY;
const FROM_EMAIL     = 'Manny at AuraLayer <support@auralayer.ai>';
const NOTIFY_EMAIL   = 'tvchpoint@gmail.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://auralayer.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { email, source = 'email_gate', blend = '' } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  const emailLower = email.trim().toLowerCase();

  // 1. ADD TO LOOPS AUDIENCE
  if (LOOPS_API_KEY) {
    try {
      const loopsRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${LOOPS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailLower,
          source: source,
          userGroup: 'beta',
          subscribed: true
        }),
      });
      const loopsData = await loopsRes.json();
      console.log('[Loops] status:', loopsRes.status, 'response:', JSON.stringify(loopsData));
    } catch (err) {
      console.error('[Loops] fetch error:', err.message);
    }
  } else {
    console.warn('[Loops] LOOPS_API_KEY missing');
  }

  if (RESEND_API_KEY) {

    // 2. INSTANT WELCOME EMAIL TO USER
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: emailLower,
          subject: 'Your AuraLayer blend is ready.',
          html: buildWelcomeEmail(blend)
        }),
      });
      const resendData = await resendRes.json();
      console.log('[Resend welcome] status:', resendRes.status, 'response:', JSON.stringify(resendData));
    } catch (err) {
      console.error('[Resend welcome] fetch error:', err.message);
    }

    // 3. INSTANT NOTIFICATION EMAIL TO MANNY
    try {
      const notifyRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: NOTIFY_EMAIL,
          subject: `✦ New AuraLayer signup: ${emailLower}`,
          html: `<div style="font-family:monospace;font-size:14px;padding:20px;background:#F5EFE4;">
            <p style="font-size:18px;font-weight:bold;color:#C9922A;">✦ New blend captured</p>
            <p><strong>Email:</strong> ${emailLower}</p>
            <p><strong>Blend:</strong> ${blend || 'not set'}</p>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>`
        }),
      });
      const notifyData = await notifyRes.json();
      console.log('[Resend notify] status:', notifyRes.status, 'response:', JSON.stringify(notifyData));
    } catch (err) {
      console.error('[Resend notify] fetch error:', err.message);
    }

  } else {
    console.warn('[Resend] RESEND_API_KEY missing');
  }

  return res.status(200).json({ ok: true });
}

function buildWelcomeEmail(blend) {
  const blendPill = blend
    ? `<p style="margin:0 0 16px;display:inline-block;font-family:'Courier New',monospace;font-size:11px;color:#C9922A;background:rgba(201,146,42,0.1);border:1px solid rgba(201,146,42,0.28);border-radius:8px;padding:7px 12px;">✦ ${blend}</p><br>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F5EFE4;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EFE4;">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EFE4;max-width:600px;">

  <tr><td style="padding:28px 28px 16px;">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:8px;vertical-align:middle;">
        <div style="width:22px;height:5px;border-radius:20px;background:linear-gradient(90deg,#E8C96B,#C9922A);margin-bottom:4px;"></div>
        <div style="width:16px;height:5px;border-radius:20px;background:#C9922A;opacity:0.65;margin-bottom:4px;"></div>
        <div style="width:10px;height:5px;border-radius:20px;background:#A07518;opacity:0.35;"></div>
      </td>
      <td style="vertical-align:middle;">
        <span style="font-family:'Arial Black',Arial,sans-serif;font-size:20px;font-weight:900;color:#1A1510;">AuraLayer</span><span style="font-family:'Arial Black',Arial,sans-serif;font-size:20px;font-weight:900;color:#C9922A;">.ai</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:0 28px;">
    <div style="border-top:1px solid rgba(26,21,16,0.1);"></div>
  </td></tr>

  <tr><td style="padding:36px 28px 24px;">
    <p style="font-size:10px;letter-spacing:0.18em;color:#C9922A;font-weight:700;margin:0 0 16px;text-transform:uppercase;">// You're in</p>
    ${blendPill}
    <h1 style="font-size:28px;font-weight:900;color:#1A1510;line-height:1.15;margin:0 0 20px;font-family:'Arial Black',Arial,sans-serif;">
      Your AuraLayer blend<br>is working for you.
    </h1>
    <p style="font-size:15px;color:#6B6358;line-height:1.75;margin:0;">
      Every creator in your niche is using the same AI tools — getting the same output. Your blend is different. It's built around your exact creative percentages, your voice, your niche.
    </p>
  </td></tr>

  <tr><td style="padding:0 28px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;border:1px solid rgba(201,146,42,0.2);border-radius:12px;">
      <tr><td style="padding:24px 28px;">
        <p style="font-size:10px;letter-spacing:0.16em;color:#C9922A;font-weight:700;margin:0 0 16px;text-transform:uppercase;">// What your blend unlocks</p>
        <p style="font-size:14px;color:#5A5248;line-height:1.7;margin:0 0 12px;"><span style="color:#C9922A;font-weight:700;">✦ Your exact percentages</span> — Claude, Canva, Perplexity weighted to your creative style. Not generic. Not equal. Yours.</p>
        <p style="font-size:14px;color:#5A5248;line-height:1.7;margin:0 0 12px;"><span style="color:#C9922A;font-weight:700;">✦ Output that sounds like you</span> — not like everyone else running the same prompt into the same tool.</p>
        <p style="font-size:14px;color:#5A5248;line-height:1.7;margin:0 0 12px;"><span style="color:#C9922A;font-weight:700;">✦ A real workflow</span> — exactly which tool to use for what, in what order, for your specific goal.</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:4px;background:#FFF5F5;border-radius:8px;border:1px solid rgba(255,0,0,0.15);">
          <tr><td style="padding:14px 16px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:12px;vertical-align:top;padding-top:2px;">
                <table cellpadding="0" cellspacing="0" border="0" style="background:#FF0000;border-radius:6px;">
                  <tr><td style="padding:5px 10px;"><span style="font-size:11px;font-weight:900;color:#FFFFFF;white-space:nowrap;">&#9654; YouTube</span></td></tr>
                </table>
              </td>
              <td style="vertical-align:top;">
                <span style="font-size:13px;color:#1A1510;line-height:1.6;font-weight:700;">YouTube Intelligence&#8482;</span><br>
                <span style="font-size:13px;color:#5A5248;line-height:1.6;">Drop any YouTube URL into your blend. AuraLayer reads the video and folds those insights directly into your output.</span>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 28px 28px;" align="center">
    <a href="https://auralayer.ai/app?from=email" style="display:inline-block;background:#C9922A;color:#FFFFFF;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Open My AuraLayer →</a>
  </td></tr>

  <tr><td style="padding:0 28px 36px;">
    <p style="font-size:14px;color:#6B6358;line-height:1.75;margin:0 0 10px;">If you haven't locked in Founding Access yet — beta closes April 30. After that, it moves to $9/month. Founding Access is $49 once, yours forever.</p>
    <p style="font-size:13px;color:#9A9690;line-height:1.6;margin:0;">P.S. — If this landed in spam, move it to Primary. You'll want to see what comes next.</p>
  </td></tr>

  <tr><td style="padding:20px 28px;border-top:1px solid rgba(26,21,16,0.08);">
    <p style="font-size:11px;color:#9A9690;margin:0;line-height:1.6;">Same AI tools. Your voice. Every time. &nbsp;·&nbsp; Bala Cynwyd, PA 19004</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
