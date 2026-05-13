import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// POST /api/stripe/portal
// Creates a Stripe Billing Portal session so subscribers can manage their plan.
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let stripe: ReturnType<typeof getStripe>;
    try { stripe = getStripe(); } catch {
      return NextResponse.json({ error: 'Stripe not configured on this server' }, { status: 503 });
    }

    const { uid } = await req.json() as { uid: string };
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    // Read stripeCustomerId from Firestore
    const fsRes = await fetch(`${FS_BASE}/users/${uid}`, {
      headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store',
    });
    if (!fsRes.ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const raw = await fsRes.json() as Record<string, unknown>;
    const fields = raw.fields as Record<string, { stringValue?: string }> | undefined;
    const customerId = fields?.stripeCustomerId?.stringValue;
    if (!customerId) return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });

    const origin = req.headers.get('origin') ?? `https://${req.headers.get('host')}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
