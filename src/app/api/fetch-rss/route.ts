import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlToFetch = searchParams.get('url');

    if (!urlToFetch) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(urlToFetch);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: `Invalid URL format for external feed: ${urlToFetch}` }, { status: 400 });
    }

    // Use native fetch — works reliably in Vercel serverless functions.
    // CloakBrowser requires a writable filesystem and is not compatible with Vercel.
    const response = await fetch(urlToFetch, {
      headers: {
        // Mimic a real browser to avoid basic bot-detection on RSS endpoints
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeAI RSS Reader/1.0)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch external RSS feed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom')) {
      // Still try to return it — some feeds send text/plain or text/html but are valid XML
      console.warn(`Unexpected content-type from RSS feed: ${contentType}`);
    }

    const rawRssContent = await response.text();
    return NextResponse.json({ rawRssContent });

  } catch (error) {
    console.error('Error in /api/fetch-rss:', error);
    let message = 'An unexpected error occurred while fetching the RSS feed.';
    if (error instanceof Error) {
      message = error.name === 'TimeoutError'
        ? 'The request to fetch the external RSS feed timed out.'
        : error.message;
    }
    return NextResponse.json({ error: `Error fetching external RSS feed: ${message}` }, { status: 500 });
  }
}
