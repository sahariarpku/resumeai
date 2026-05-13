import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { RouterConfig } from './types';

export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'config', 'admin'));
    if (!snap.exists()) return false;
    const data = snap.data();
    return Array.isArray(data?.adminUids) && data.adminUids.includes(uid);
  } catch {
    return false;
  }
}

export async function getRouterConfig(): Promise<RouterConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'config', 'router'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      providers: data.providers ?? [],
      combos: data.combos ?? [],
      activeComboId: data.activeComboId ?? null,
    } as RouterConfig;
  } catch {
    return null;
  }
}

export async function saveRouterConfig(config: RouterConfig, uid: string): Promise<void> {
  await setDoc(doc(db, 'config', 'router'), {
    ...config,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}
