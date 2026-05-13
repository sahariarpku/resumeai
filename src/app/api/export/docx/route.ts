import { NextResponse } from 'next/server';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { markdown } = await request.json();
    if (!markdown) {
      return NextResponse.json({ error: 'Markdown content is required' }, { status: 400 });
    }

    // Convert markdown to HTML
    const htmlContent = await marked.parse(markdown);

    // Add some basic styling for the docx converter
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
            h1 { font-size: 24pt; color: #111; margin-bottom: 8pt; text-align: center; }
            h2 { font-size: 14pt; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 16pt; margin-bottom: 8pt; }
            h3 { font-size: 12pt; color: #444; margin-top: 12pt; margin-bottom: 4pt; font-weight: bold; }
            p { margin-top: 0; margin-bottom: 8pt; }
            ul { margin-top: 0; margin-bottom: 8pt; padding-left: 20pt; }
            li { margin-bottom: 4pt; }
            strong { font-weight: bold; }
            em { font-style: italic; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Convert HTML to DOCX
    const fileBuffer = await HTMLtoDOCX(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    // Return the file
    return new NextResponse(new Uint8Array(fileBuffer as any), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="resume.docx"',
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}
