import { NextResponse } from 'next/server';

// GET /api/oauth/config — tells the client which OAuth providers are configured server-side
export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    openrouter: true, // always available (PKCE, no server credentials needed)
  });
}
