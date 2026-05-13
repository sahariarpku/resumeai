import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'node:module';

// Force Node.js runtime — pdf-parse requires Node APIs.
export const runtime = 'nodejs';

// Use createRequire so webpack never touches pdf-parse at bundle time.
const _require = createRequire(import.meta.url);
type PdfData = { text: string; numpages: number };
const pdfParse = _require('pdf-parse') as (buf: Buffer) => Promise<PdfData>;

// POST /api/pdf/extract
// Accepts a multipart form upload with a `file` field (PDF, .txt, or .md).
// Returns { text: string } with the extracted plain text.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    const name = file.name.toLowerCase();

    // Plain text / markdown — just decode
    if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      name.endsWith('.txt') ||
      name.endsWith('.md')
    ) {
      return NextResponse.json({ text: buffer.toString('utf-8') });
    }

    // PDF — extract with pdf-parse v1
    if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      const text = data.text?.trim() ?? '';
      if (!text) {
        return NextResponse.json(
          { error: 'PDF has no extractable text. It may be scanned or image-based.' },
          { status: 422 }
        );
      }
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF, .txt, or .md file.' },
      { status: 415 }
    );
  } catch (err) {
    console.error('PDF extract error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
