/**
 * Server-side PDF text extraction using pdf-parse.
 * Only call this from API routes (Node.js runtime).
 *
 * Uses pdf-parse/lib/pdf-parse directly to avoid the test-file require
 * that the index entrypoint triggers in some bundler environments.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let pdfParse: (buf: Buffer) => Promise<{ text: string }>;

  try {
    // Use the internal lib path to avoid the test-file side-effect in the
    // package's index.js that can fail when bundled with webpack.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParse = require("pdf-parse/lib/pdf-parse");
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParse = require("pdf-parse");
  }

  const data = await pdfParse(buffer);

  if (!data || typeof data.text !== "string") {
    throw new Error("PDF parser returned no text content");
  }

  return data.text;
}
