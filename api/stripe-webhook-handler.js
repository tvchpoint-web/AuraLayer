// api/stripe-webhook-handler.js
// Vercel Serverless Function — AuraLayer Stripe webhook
// Receives: Stripe webhook events (signed with STRIPE_WEBHOOK_SECRET)
// Handles:  checkout.session.completed  (one-time $49 Founding, future one-time SKUs)
// TODO:     invoice.paid  (for $9/mo recurring post-launch May 1)
// Actions:  1) Verify Stripe signature against RAW body
//           2) Fire server-side Purchase event to Meta CAPI (pixel 26750033267923397)
//           3) Send instant notification email to Manny via Resend
//           4) Return 200 fast (Stripe retries on 5xx / timeout)

import Stripe from 'stripe';
import crypto from 'crypto';

// CRITICAL — Stripe signature verification requires the EXACT raw body bytes.
// Disable Vercel's automatic JSON parsing for this endpoint.
export const config = {
  api: {
    bodyParser: false,
  },
};

const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const RESEND_API_KEY         = process.env.RESEND_API_KEY;

const META_PIXEL_ID = '26750033267923397';
const META_API_VER  = 'v18.0';
const FROM_EMAIL    = 'AuraLayer Sales <support@auralayer.ai>';
const NOTIFY_EMAIL  = 'tvchpoint@gmail.com';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Read raw request body as a Buffer (required by stripe.webhooks.constructEvent)
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// SHA-256 hash for Meta CAPI user_data (Meta requires hashed PII)
function sha256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

// Fallback plan inference if Payment Link metadata is missing
function inferPlanFromAmount(amount) {
  if (amount === 49) return 'founding';   // or 'bundle' — add metadata to Payment Link to distinguish
  if (amount === 9)  return 'starter';
  if (amount === 39) return 'pro';
  if (amount === 92) return 'visionary';
  return 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET missing');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // 1. VERIFY STRIPE SIGNATURE
  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig     = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    console.log('[stripe-webhook] verified event:', event.type, event.id);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // 2. ROUTE BY EVENT TYPE
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email       = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
    const amountTotal = (session.amount_total || 0) / 100;                     // cents → dollars
    const currency    = (session.currency || 'usd').toUpperCase();
    const sessionId   = session.id;
    const plan        = session.metadata?.plan || inferPlanFromAmount(amountTotal);
    const eventTime   = event.created || Math.floor(Date.now() / 1000);

    console.log('[stripe-webhook] checkout.session.completed:', { email, amountTotal, currency, plan, sessionId });

    // 3. FIRE META CAPI PURCHASE (server-side)
    if (META_CAPI_ACCESS_TOKEN) {
      try {
        const userData = {};
        if (email)                         userData.em                = [sha256(email)];
        if (session.metadata?.client_ip)   userData.client_ip_address = session.metadata.client_ip;
        if (session.metadata?.client_ua)   userData.client_user_agent = session.metadata.client_ua;
        if (session.metadata?.fbp)         userData.fbp               = session.metadata.fbp;
        if (session.metadata?.fbc)         userData.fbc               = session.metadata.fbc;

        const capiBody = {
          data: [{
            event_name:       'Purchase',
            event_time:       eventTime,
            event_id:         sessionId,                        // dedup key (cs_xxx) — stable per checkout
            event_source_url: 'https://auralayer.ai/app',
            action_source:    'website',
            user_data:        userData,
            custom_data: {
              value:        amountTotal,
              currency:     currency,
              content_name: plan,
              content_type: 'product',
              order_id:     sessionId,
            },
          }],
        };

        const capiUrl = `https://graph.facebook.com/${META_API_VER}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`;
        const capiRes = await fetch(capiUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(capiBody),
        });
        const capiData = await capiRes.json();
        console.log('[Meta CAPI] status:', capiRes.status, 'response:', JSON.stringify(capiData));
      } catch (err) {
        console.error('[Meta CAPI] fetch error:', err.message);
        // Do NOT rethrow — we don't want Stripe to retry just because Meta failed.
      }
    } else {
      console.warn('[Meta CAPI] META_CAPI_ACCESS_TOKEN missing — skipping CAPI fire');
    }

    // 4. NOTIFY MANNY
    if (RESEND_API_KEY) {
      try {
        const notifyRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    FROM_EMAIL,
            to:      NOTIFY_EMAIL,
            subject: `💰 AuraLayer sale: $${amountTotal} · ${plan} · ${email || 'no-email'}`,
            html: `<div style="font-family:monospace;font-size:14px;padding:20px;background:#F5EFE4;">
              <p style="font-size:20px;font-weight:bold;color:#C9922A;margin:0 0 16px;">💰 New paid conversion</p>
              <p style="margin:4px 0;"><strong>Email:</strong> ${email || '(not provided)'}</p>
              <p style="margin:4px 0;"><strong>Amount:</strong> $${amountTotal} ${currency}</p>
              <p style="margin:4px 0;"><strong>Plan:</strong> ${plan}</p>
              <p style="margin:4px 0;"><strong>Stripe session:</strong> ${sessionId}</p>
              <p style="margin:4px 0;"><strong>Time:</strong> ${new Date(eventTime * 1000).toISOString()}</p>
              <p style="margin:16px 0 0;color:#6B6358;font-size:12px;">Server-side Purchase fired to Meta CAPI (pixel ${META_PIXEL_ID}).</p>
            </div>`,
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

  } else {
    console.log('[stripe-webhook] ignoring event type:', event.type);
  }

  // 5. ACK STRIPE FAST (always 200 after signature verified)
  return res.status(200).json({ received: true });
}
