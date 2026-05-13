import { NextResponse } from 'next/server';
import { marked } from 'marked';

export async function POST(request: Request) {
  try {
    const { markdown, html } = await request.json();
    if (!markdown && !html) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let fullHtml = "";
    if (html) {
      fullHtml = html;
    } else {
      const htmlBody = await marked.parse(markdown);
      fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            :root {
              --primary: #1f2937;
              --text: #374151;
              --border: #e5e7eb;
            }
            body { 
              font-family: 'Inter', sans-serif; 
              font-size: 11pt; 
              line-height: 1.6; 
              color: var(--text);
              margin: 0;
              padding: 40px;
            }
            h1 { font-size: 24pt; color: var(--primary); margin-bottom: 8px; text-align: center; font-weight: 700; }
            h2 { font-size: 14pt; color: var(--primary); border-bottom: 2px solid var(--border); padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }
            h3 { font-size: 12pt; color: var(--primary); margin-top: 16px; margin-bottom: 4px; font-weight: 600; }
            p { margin-top: 0; margin-bottom: 8px; }
            ul { margin-top: 0; margin-bottom: 12px; padding-left: 24px; }
            li { margin-bottom: 4px; }
            a { color: #2563eb; text-decoration: none; }
            strong { font-weight: 600; color: var(--primary); }
          </style>
        </head>
        <body>${htmlBody}</body>
      </html>`;
    }

    // Launch headless browser to generate PDF
    const { launch } = await import('cloakbrowser');
    const browser = await launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });
      
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="resume.pdf"',
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
