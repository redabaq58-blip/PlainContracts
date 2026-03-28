import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/utils/pdf";
import { MAX_PDF_BYTES, MAX_CONTRACT_CHARS } from "@/constants";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isPdf =
    (file.type === "application/pdf") ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 }
    );
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: `File must be under ${MAX_PDF_BYTES / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromPdf(buffer);

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be scanned or image-based. Please paste the contract text manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: text.slice(0, MAX_CONTRACT_CHARS),
      truncated: text.length > MAX_CONTRACT_CHARS,
      charCount: Math.min(text.length, MAX_CONTRACT_CHARS),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to parse PDF. Please paste the contract text manually.",
      },
      { status: 500 }
    );
  }
}
