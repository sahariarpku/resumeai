import Stripe from 'stripe';

// Lazily initialised so missing env var doesn't break the build.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' as any });
  }
  return _stripe;
}
