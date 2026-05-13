import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

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

interface Provider { id: string; type: string; baseUrl: string; apiKey: string; }

// GET /api/ai/models?providerId=xxx
// Fetches available models from a configured provider's /models endpoint.
export async function GET(req: NextRequest) {
  try {
    const idToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const providerId = req.nextUrl.searchParams.get('providerId');
    if (!idToken || !providerId) return NextResponse.json({ models: [] });

    // Read router config from Firestore
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config/router`;
    const fsRes = await fetch(fsUrl, { headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store' });
    if (!fsRes.ok) return NextResponse.json({ models: [], error: 'Cannot read router config' });

    const raw = (await fsRes.json()) as Record<string, unknown>;
    const fields = (raw.fields as Record<string, unknown>) ?? {};
    const providers = (parseValue(fields.providers) as Provider[] | undefined) ?? [];
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return NextResponse.json({ models: [], error: 'Provider not found' });

    // Normalise base URL (Gemini quirk)
    let base = provider.baseUrl.replace(/\/$/, '');
    if (base.includes('generativelanguage.googleapis.com') && !base.includes('/openai')) {
      base = 'https://generativelanguage.googleapis.com/v1beta/openai';
    }

    const modelsRes = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });

    if (!modelsRes.ok) {
      return NextResponse.json({ models: [], error: `Provider returned ${modelsRes.status}` });
    }

    const data = await modelsRes.json() as { data?: Array<{ id: string }> } | Array<{ id: string }>;
    const ids = Array.isArray(data)
      ? data.map((m) => m.id)
      : (data.data ?? []).map((m) => m.id);

    return NextResponse.json({ models: ids.filter(Boolean).sort() });
  } catch (err) {
    return NextResponse.json({ models: [], error: err instanceof Error ? err.message : String(err) });
  }
}
