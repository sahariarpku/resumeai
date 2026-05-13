import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

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

interface Provider { id: string; name: string; type: string; baseUrl: string; apiKey: string; enabled: boolean; refreshToken?: string; tokenExpiresAt?: number; }
interface Combo { id: string; name: string; models: string[]; strategy: string; }
interface Config { providers: Provider[]; combos: Combo[]; activeComboId: string | null; activeModel?: string; }

async function loadConfig(idToken: string): Promise<Config | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config/router`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: 'no-store' });
  if (!res.ok) return null;
  const raw = (await res.json()) as Record<string, unknown>;
  const fields = (raw.fields as Record<string, unknown>) ?? {};
  return {
    providers: (parseValue(fields.providers) as Provider[] | undefined) ?? [],
    combos: (parseValue(fields.combos) as Combo[] | undefined) ?? [],
    activeComboId: (parseValue(fields.activeComboId) as string | null) ?? null,
    activeModel: (parseValue(fields.activeModel) as string | undefined) ?? undefined,
  };
}

function normalizeBase(baseUrl: string): string {
  if (baseUrl.includes('generativelanguage.googleapis.com') && !baseUrl.includes('/openai')) {
    return 'https://generativelanguage.googleapis.com/v1beta/openai';
  }
  return baseUrl.replace(/\/$/, '');
}

// POST /api/ai/test — sends a one-word prompt to the active model and returns latency + response
export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const idToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (!idToken) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

    let config = await loadConfig(idToken);

    // Env fallback
    const envKey = process.env.OPENROUTER_API_KEY;
    if ((!config || (!config.activeComboId && !config.activeModel)) && envKey) {
      config = {
        providers: [{ id: 'env-or', name: 'OpenRouter', type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', apiKey: envKey, enabled: true }],
        combos: [{ id: 'env-combo', name: 'Default', models: ['env-or/openai/gpt-4o-mini'], strategy: 'fallback' }],
        activeComboId: 'env-combo',
      };
    }

    if (!config) return NextResponse.json({ ok: false, message: 'AI router not configured' }, { status: 503 });

    // Resolve active model
    let modelEntry: string | null = null;
    if (config.activeModel && !config.activeComboId) {
      modelEntry = config.activeModel;
    } else {
      const combo = config.combos.find((c) => c.id === config!.activeComboId);
      modelEntry = combo?.models[0] ?? null;
    }

    if (!modelEntry) return NextResponse.json({ ok: false, message: 'No model activated' }, { status: 503 });

    const slash = modelEntry.indexOf('/');
    const providerId = modelEntry.slice(0, slash);
    const modelName = modelEntry.slice(slash + 1);
    const provider = config.providers.find((p) => p.id === providerId && p.enabled);
    if (!provider) return NextResponse.json({ ok: false, message: 'Provider not found or disabled' }, { status: 503 });

    const base = normalizeBase(provider.baseUrl);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://resumeai.app',
      'X-Title': 'ResumeForge',
    };

    let response = '';

    if (provider.type === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: modelName, max_tokens: 16, messages: [{ role: 'user', content: 'Reply with just the word OK.' }] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json({ ok: false, message: `${res.status}: ${t.slice(0, 200)}`, ms: Date.now() - start }, { status: 200 });
      }
      const data = await res.json() as { content: Array<{ text: string }> };
      response = data.content[0]?.text ?? '';
    } else {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: modelName, messages: [{ role: 'user', content: 'Reply with just the word OK.' }], max_tokens: 16, temperature: 0 }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json({ ok: false, message: `${res.status}: ${t.slice(0, 200)}`, ms: Date.now() - start }, { status: 200 });
      }
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      response = data.choices[0]?.message?.content ?? '';
    }

    return NextResponse.json({
      ok: true,
      response: response.trim().slice(0, 80),
      model: modelName,
      provider: provider.name,
      ms: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err instanceof Error ? err.message : String(err), ms: Date.now() - start });
  }
}
