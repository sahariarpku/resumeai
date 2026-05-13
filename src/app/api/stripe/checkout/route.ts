import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// POST /api/stripe/checkout
// Creates a Stripe Checkout session and returns the URL to redirect to.
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let stripe: ReturnType<typeof getStripe>;
    try { stripe = getStripe(); } catch {
      return NextResponse.json({ error: 'Stripe not configured on this server' }, { status: 503 });
    }

    const { priceId, uid, email } = await req.json() as { priceId: string; uid: string; email: string };
    if (!priceId || !uid) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Look up existing Stripe customer ID from Firestore
    let customerId: string | undefined;
    const fsRes = await fetch(`${FS_BASE}/users/${uid}`, {
      headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store',
    });
    if (fsRes.ok) {
      const raw = await fsRes.json() as Record<string, unknown>;
      const fields = raw.fields as Record<string, { stringValue?: string }> | undefined;
      customerId = fields?.stripeCustomerId?.stringValue;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ email: email || undefined, metadata: { uid } });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') ?? `https://${req.headers.get('host')}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/billing?canceled=1`,
      metadata: { uid },
      subscription_data: { metadata: { uid } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
