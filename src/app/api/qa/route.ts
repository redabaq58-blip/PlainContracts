import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamQAAnswer } from "@/lib/ai/qa";

const QASchema = z.object({
  contractText: z.string().max(6000),
  analysisContext: z.string().max(3000).default(""),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(24)
    .default([]),
  question: z.string().min(1).max(2000),
  privacyMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = QASchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { contractText, analysisContext, messages, question, privacyMode } =
    parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const gen = streamQAAnswer(
          contractText,
          analysisContext,
          messages,
          question,
          privacyMode
        );

        for await (const delta of gen) {
          controller.enqueue(
            enc.encode(`data: ${JSON.stringify({ delta })}\n\n`)
          );
        }

        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
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
