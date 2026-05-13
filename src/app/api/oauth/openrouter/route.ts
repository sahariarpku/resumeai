import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PROVIDER_ID = 'openrouter-oauth';
const COMBO_ID = 'openrouter-oauth-combo';

// ─── Firestore wire-format helpers ────────────────────────────────────────────

function parseValue(val: unknown): unknown {
  const v = val as Record<string, unknown>;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue) {
    const av = v.arrayValue as { values?: unknown[] };
    return (av.values ?? []).map(parseValue);
  }
  if (v.mapValue) {
    const mv = v.mapValue as { fields?: Record<string, unknown> };
    const obj: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(mv.fields ?? {})) obj[k] = parseValue(fv);
    return obj;
  }
  return undefined;
}

function toFsValue(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

interface Provider { id: string; name: string; type: string; baseUrl: string; apiKey: string; enabled: boolean; }
interface Combo { id: string; name: string; models: string[]; strategy: string; stickyLimit?: number; }

// ─── POST /api/oauth/openrouter ───────────────────────────────────────────────
// Exchange PKCE code for an OpenRouter API key and persist it to Firestore.

export async function POST(req: NextRequest) {
  try {
    const { code, codeVerifier, idToken } = await req.json() as {
      code: string; codeVerifier: string; idToken: string;
    };

    if (!code || !codeVerifier || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Exchange PKCE code for OpenRouter API key
    const orRes = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });
    if (!orRes.ok) {
      const text = await orRes.text();
      return NextResponse.json({ error: `OpenRouter exchange failed: ${text.slice(0, 300)}` }, { status: 400 });
    }
    const { key: apiKey } = await orRes.json() as { key: string };

    // 2. Read existing Firestore router config (if any)
    const readRes = await fetch(`${FS_BASE}/config/router`, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    });

    let providers: Provider[] = [];
    let combos: Combo[] = [];
    let activeComboId: string | null = null;

    if (readRes.ok) {
      const raw = (await readRes.json()) as Record<string, unknown>;
      const fields = (raw.fields as Record<string, unknown>) ?? {};
      const parsedProviders = parseValue(fields.providers);
      const parsedCombos = parseValue(fields.combos);
      const parsedActive = parseValue(fields.activeComboId);
      if (Array.isArray(parsedProviders)) providers = parsedProviders as Provider[];
      if (Array.isArray(parsedCombos)) combos = parsedCombos as Combo[];
      if (typeof parsedActive === 'string') activeComboId = parsedActive;
    }

    // 3. Upsert OpenRouter provider + default combo
    const newProvider: Provider = {
      id: PROVIDER_ID,
      name: 'OpenRouter (OAuth)',
      type: 'openai',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey,
      enabled: true,
    };
    const newCombo: Combo = {
      id: COMBO_ID,
      name: 'OpenRouter Default',
      models: [`${PROVIDER_ID}/openai/gpt-4o-mini`],
      strategy: 'fallback',
    };

    const updatedProviders = [...providers.filter((p) => p.id !== PROVIDER_ID), newProvider];
    const updatedCombos = [...combos.filter((c) => c.id !== COMBO_ID), newCombo];
    // Only auto-activate if nothing is active yet
    const updatedActive = activeComboId ?? COMBO_ID;

    // 4. Write back to Firestore via REST PATCH (creates doc if absent)
    const body = {
      fields: {
        providers: toFsValue(updatedProviders),
        combos: toFsValue(updatedCombos),
        activeComboId: toFsValue(updatedActive),
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    };
    const mask = ['providers', 'combos', 'activeComboId', 'updatedAt']
      .map((f) => `updateMask.fieldPaths=${f}`)
      .join('&');

    const writeRes = await fetch(`${FS_BASE}/config/router?${mask}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!writeRes.ok) {
      const text = await writeRes.text();
      return NextResponse.json({ error: `Firestore write failed: ${text.slice(0, 300)}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, activeComboId: updatedActive });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
