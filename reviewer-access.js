// /api/reviewer-access.js
// Logs every reviewer magic link access to a persistent JSON store.
// Stored in Vercel KV (or falls back to a simple append-to-log approach).
//
// TO VIEW LOGS: GET /api/reviewer-access?admin=AURALAYER_ADMIN_KEY
// TO ADD A NEW TOKEN: add to REVIEWER_TOKENS in app.html and redeploy.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://auralayer.ai');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: Admin dashboard — view all logs ──
  if (req.method === 'GET') {
    const adminKey = req.query.admin;
    if (adminKey !== process.env.AURALAYER_ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { kv } = await import('@vercel/kv');
      const keys = await kv.keys('reviewer:*');
      const entries = await Promise.all(keys.map(k => kv.get(k)));
      // Sort newest first
      entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      return res.status(200).json({ total: entries.length, entries });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: Log a reviewer access event ──
  if (req.method === 'POST') {
    const { token, label, ts, ua, ref, sessionId } = req.body || {};
    if (!token || !label) {
      return res.status(400).json({ error: 'Missing token or label' });
    }

    const entry = {
      token,
      label,
      ts:        ts || new Date().toISOString(),
      sessionId: sessionId || 'unknown',
      ua:        ua    || 'unknown',
      ref:       ref   || 'direct',
      ip:        req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
    };

    try {
      const { kv } = await import('@vercel/kv');
      // Key: reviewer:{token}:{sessionId} — unique per visit
      const key = `reviewer:${token}:${sessionId || Date.now()}`;
      await kv.set(key, entry);

      // Also notify Manny via email (fire-and-forget)
      notifyEmail(entry).catch(() => {});

      return res.status(200).json({ ok: true });
    } catch (e) {
      // KV not available — still return OK so app doesn't error
      console.error('reviewer-access KV error:', e.message);
      return res.status(200).json({ ok: true, warn: 'KV unavailable' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Send a quick email notification to support@auralayer.ai on each access
async function notifyEmail(entry) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const date = new Date(entry.ts).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from:    'AuraLayer <noreply@auralayer.ai>',
      to:      ['support@auralayer.ai'],
      subject: `🔑 Reviewer Access — ${entry.label} (${entry.token})`,
      html: `
        <p><strong>Reviewer link used</strong></p>
        <table style="border-collapse:collapse;font-family:monospace;font-size:13px;">
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Token</td><td><strong>${entry.token}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Label</td><td>${entry.label}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Time</td><td>${date} ET</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Session</td><td>${entry.sessionId}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">IP</td><td>${entry.ip}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Referrer</td><td>${entry.ref}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">UA</td><td style="font-size:11px;max-width:400px;">${entry.ua}</td></tr>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#888;">
          View all reviewer logs: 
          <a href="https://auralayer.ai/api/reviewer-access?admin=YOUR_ADMIN_KEY">
            /api/reviewer-access?admin=...
          </a>
        </p>
      `,
    }),
  });
}
