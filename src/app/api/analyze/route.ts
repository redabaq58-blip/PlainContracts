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
  language: z.string().optional().default("English"),
});

export async function POST(req: NextRequest) {
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

  const { contractText, audienceLevel, mode, privacyMode, layer1Cache, language } =
    parsed.data;

  const stream = encodePipelineStream({
    contractText,
    audienceLevel,
    mode,
    privacyMode,
    layer1Cache,
    language,
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
