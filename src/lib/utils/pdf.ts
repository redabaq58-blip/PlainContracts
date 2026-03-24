/**
 * Server-side PDF text extraction using pdf-parse.
 * Only call this from API routes (Node.js runtime).
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues with Next.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text as string;
}
