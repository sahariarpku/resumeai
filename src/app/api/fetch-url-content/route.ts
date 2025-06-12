
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const urlToFetch = searchParams.get('url');

  if (!urlToFetch) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate the URL to prevent potential SSRF vulnerabilities, though basic fetch might also fail for non-HTTP/S URLs
    const parsedUrl = new URL(urlToFetch);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.' }, { status: 400 });
    }

    const response = await fetch(urlToFetch, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Add a timeout to prevent long-hanging requests
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, { status: response.status });
    }

    const htmlContent = await response.text();
    return NextResponse.json({ htmlContent });

  } catch (error) {
    console.error('Error fetching URL content:', error);
    let errorMessage = 'An unknown error occurred while fetching the URL.';
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            errorMessage = 'The request to fetch the URL timed out.';
        } else {
            errorMessage = error.message;
        }
    }
    return NextResponse.json({ error: `Error fetching URL: ${errorMessage}` }, { status: 500 });
  }
}
