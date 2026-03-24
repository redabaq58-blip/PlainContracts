import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodePipelineStream } from "@/lib/ai/pipeline";

const Layer1CacheSchema = z.object({
  contractType: z.string(),
  jurisdiction: z.string(),
  signerRole: z.string(),
  counterpartyRole: z.string(),
  isComplete: z.boolean(),
  completenessNote: z.string(),
  confidence: z.number(),
});

const AnalyzeSchema = z.object({
  contractText: z.string().min(50).max(100_000),
  audienceLevel: z.enum(["SIMPLE", "INFORMED", "DETAILED"]),
  mode: z.enum(["SIGNER", "SENDER"]),
  privacyMode: z.boolean().optional().default(false),
  layer1Cache: Layer1CacheSchema.optional(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let body: z.infer<typeof AnalyzeSchema>;

  if (contentType.includes("multipart/form-data")) {
    // PDF upload path
    try {
      const formData = await req.formData();
      const contractText = formData.get("contractText") as string | null;
      const audienceLevel = formData.get("audienceLevel") as string;
      const mode = formData.get("mode") as string;
      const privacyMode = formData.get("privacyMode") === "true";

      const parsed = AnalyzeSchema.safeParse({
        contractText: contractText ?? "",
        audienceLevel,
        mode,
        privacyMode,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message ?? "Invalid input" },
          { status: 400 }
        );
      }
      body = parsed.data;
    } catch {
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
    }
  } else {
    // JSON path
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = AnalyzeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    body = parsed.data;
  }

  const stream = encodePipelineStream({
    contractText: body.contractText,
    audienceLevel: body.audienceLevel,
    mode: body.mode,
    privacyMode: body.privacyMode,
    layer1Cache: body.layer1Cache,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
