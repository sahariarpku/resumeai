
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try { // Top-level try-catch for very early errors
    const { searchParams } = new URL(request.url);
    const urlToFetch = searchParams.get('url');

    if (!urlToFetch) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(urlToFetch);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.' }, { status: 400 });
      }
    } catch (e) {
      console.error('Invalid URL format provided for "urlToFetch":', urlToFetch, e);
      return NextResponse.json({ error: `Invalid URL format for external feed: ${urlToFetch}` }, { status: 400 });
    }


    // Inner try-catch for the actual fetch operation
    try {
      const response = await fetch(urlToFetch, {
        headers: {
          'User-Agent': 'ResumeForgeApp/1.0 (AI Job Feed Processor)',
          // Added application/atom+xml
          'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8',
        },
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });

      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch external RSS feed: ${response.status} ${response.statusText}` }, { status: response.status });
      }

      const contentType = response.headers.get('content-type');
      // Added application/atom+xml to the check
      if (!contentType || !(contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom'))) {
          return NextResponse.json({ error: `Unexpected content type from external URL: ${contentType}. Expected XML, RSS, or Atom.` }, { status: 400 });
      }

      const rawRssContent = await response.text();
      return NextResponse.json({ rawRssContent });

    } catch (fetchError) {
      console.error('Error fetching or processing external RSS feed:', fetchError);
      let errorMessage = 'An unknown error occurred while fetching the external RSS feed.';
      if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
              errorMessage = 'The request to fetch the external RSS feed timed out.';
          } else {
              errorMessage = fetchError.message;
          }
      }
      return NextResponse.json({ error: `Error fetching external RSS feed: ${errorMessage}` }, { status: 500 });
    }
  } catch (initialError) { // Catch for errors before specific logic, like URL parsing of request.url
    console.error('Initial error in API route /api/fetch-rss:', initialError);
    let message = 'An unexpected error occurred in the API handler.';
    if (initialError instanceof Error) {
        message = initialError.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
