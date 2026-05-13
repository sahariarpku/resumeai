import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFsValue(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function writeSubscription(uid: string, data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFsValue(v);
  const mask = Object.keys(data).map((f) => `updateMask.fieldPaths=${f}`).join('&');
  await fetch(`${FS_BASE}/users/${uid}?${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

// POST /api/stripe/webhook
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook secret not set' }, { status: 503 });

  let stripe: ReturnType<typeof getStripe>;
  try { stripe = getStripe(); } catch {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${String(err)}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
        await writeSubscription(uid, {
          stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          subscriptionId: sub.id,
          plan: 'pro',
          subscriptionStatus: sub.status,
          currentPeriodEnd: periodEnd,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        await writeSubscription(uid, {
          subscriptionId: null,
          plan: 'free',
          subscriptionStatus: 'canceled',
          currentPeriodEnd: null,
        });
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        if (uid && customerId) await writeSubscription(uid, { stripeCustomerId: customerId });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const uid = (invoice as unknown as { subscription_details?: { metadata?: { uid?: string } } })
          .subscription_details?.metadata?.uid;
        if (uid) await writeSubscription(uid, { subscriptionStatus: 'past_due' });
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true });
}
