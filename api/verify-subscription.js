export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required', tier: 'starter' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 5 });
    if (!customers.data.length) {
      return res.status(200).json({ tier: 'starter', subscribed: false });
    }

    // Check subscriptions for each customer
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 5,
      });

      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const priceId = item.price.id;
          const productId = item.price.product;

          // Check product IDs
          if (productId === 'prod_UCr0wxtJzMofI6') {
            return res.status(200).json({ tier: 'visionary', subscribed: true, customerId: customer.id });
          }
          if (productId === 'prod_UCr0dcZs81a7Aq') {
            return res.status(200).json({ tier: 'pro', subscribed: true, customerId: customer.id });
          }
          if (productId === 'prod_UCr0FdgZZ7NiAf') {
            return res.status(200).json({ tier: 'starter', subscribed: true, customerId: customer.id });
          }
        }
      }
    }

    return res.status(200).json({ tier: 'starter', subscribed: false });
  } catch (error) {
    console.error('Subscription verify error:', error);
    return res.status(500).json({ error: 'Verification failed', tier: 'starter' });
  }
}
