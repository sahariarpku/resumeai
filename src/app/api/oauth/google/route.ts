import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PROVIDER_ID = 'google-oauth';
const COMBO_ID = 'google-oauth-combo';

function parseValue(val: unknown): unknown {
  const v = val as Record<string, unknown>;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue) { const av = v.arrayValue as { values?: unknown[] }; return (av.values ?? []).map(parseValue); }
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
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

interface Provider { id: string; name: string; type: string; baseUrl: string; apiKey: string; enabled: boolean; refreshToken?: string; tokenExpiresAt?: number; }
interface Combo { id: string; name: string; models: string[]; strategy: string; }

// POST /api/oauth/google — exchange Google OAuth PKCE code for tokens, save Gemini provider to Firestore
export async function POST(req: NextRequest) {
  try {
    const { code, codeVerifier, idToken } = await req.json() as { code: string; codeVerifier: string; idToken: string };
    if (!code || !codeVerifier || !idToken) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.' }, { status: 400 });
    }

    // Exchange code for Google tokens
    const origin = req.headers.get('origin') ?? req.nextUrl.origin;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/admin`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json({ error: `Google token exchange failed: ${text.slice(0, 300)}` }, { status: 400 });
    }

    const { access_token, refresh_token, expires_in } = await tokenRes.json() as {
      access_token: string; refresh_token: string; expires_in: number;
    };

    // Read existing Firestore config
    const readRes = await fetch(`${FS_BASE}/config/router`, {
      headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store',
    });

    let providers: Provider[] = [];
    let combos: Combo[] = [];
    let activeComboId: string | null = null;
    let activeModel: string | undefined;

    if (readRes.ok) {
      const raw = (await readRes.json()) as Record<string, unknown>;
      const fields = (raw.fields as Record<string, unknown>) ?? {};
      const pp = parseValue(fields.providers); if (Array.isArray(pp)) providers = pp as Provider[];
      const cc = parseValue(fields.combos); if (Array.isArray(cc)) combos = cc as Combo[];
      const ac = parseValue(fields.activeComboId); if (typeof ac === 'string') activeComboId = ac;
      const am = parseValue(fields.activeModel); if (typeof am === 'string') activeModel = am;
    }

    const newProvider: Provider = {
      id: PROVIDER_ID,
      name: 'Google Gemini (OAuth)',
      type: 'openai',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: access_token,
      enabled: true,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
    };

    const updatedProviders = [...providers.filter((p) => p.id !== PROVIDER_ID), newProvider];
    const updatedCombos = combos; // don't touch combos

    const body = {
      fields: {
        providers: toFsValue(updatedProviders),
        combos: toFsValue(updatedCombos),
        activeComboId: toFsValue(activeComboId),
        activeModel: toFsValue(activeModel ?? `${PROVIDER_ID}/gemini-2.0-flash`),
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    };

    const mask = ['providers', 'combos', 'activeComboId', 'activeModel', 'updatedAt']
      .map((f) => `updateMask.fieldPaths=${f}`).join('&');

    const writeRes = await fetch(`${FS_BASE}/config/router?${mask}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!writeRes.ok) {
      const text = await writeRes.text();
      return NextResponse.json({ error: `Firestore write failed: ${text.slice(0, 300)}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
