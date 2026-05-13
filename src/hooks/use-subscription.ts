"use client";

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

export type Plan = 'free' | 'pro';
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';

export interface Subscription {
  plan: Plan;
  status: SubStatus;
  subscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: number | null; // unix seconds
}

const DEFAULT: Subscription = {
  plan: 'free',
  status: 'inactive',
  subscriptionId: null,
  stripeCustomerId: null,
  currentPeriodEnd: null,
};

export function useSubscription() {
  const { currentUser } = useAuth();
  const [sub, setSub] = useState<Subscription>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setSub(DEFAULT); setLoading(false); return; }

    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (!snap.exists()) { setSub(DEFAULT); setLoading(false); return; }
      const d = snap.data();
      setSub({
        plan: (d.plan as Plan) ?? 'free',
        status: (d.subscriptionStatus as SubStatus) ?? 'inactive',
        subscriptionId: d.subscriptionId ?? null,
        stripeCustomerId: d.stripeCustomerId ?? null,
        currentPeriodEnd: d.currentPeriodEnd ?? null,
      });
      setLoading(false);
    }, () => { setSub(DEFAULT); setLoading(false); });

    return unsub;
  }, [currentUser]);

  const isPro = sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing');

  return { ...sub, isPro, loading };
}
