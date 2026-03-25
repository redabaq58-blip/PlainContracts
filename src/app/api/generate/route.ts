import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";

// ─── Schema ──────────────────────────────────────────────────────────────────

const GenerateSchema = z.object({
  contractType: z.string().min(1).max(100),
  partyA: z.string().min(1).max(200),
  partyB: z.string().min(1).max(200),
  jurisdiction: z.string().min(1).max(200),
  keyTerms: z.string().min(10).max(10_000),
  language: z.string().optional().default("English"),
  contractLength: z.enum(["concise", "standard", "comprehensive"]).optional().default("standard"),
  companyWebsite: z.string().url().max(500).optional(),
  privacyMode: z.boolean().optional().default(false),
});

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseDone(): string {
  return `done: true\n\n`;
}

// ─── Error sanitiser ─────────────────────────────────────────────────────────

function sanitizeErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";

  const msg = err.message;

  if (msg.includes("401") || msg.includes("authentication"))
    return "API authentication failed. Please contact support.";
  if (msg.includes("429") || msg.includes("rate_limit"))
    return "Too many requests. Please wait a moment and try again.";
  if (msg.includes("529") || msg.includes("overloaded"))
    return "The AI service is temporarily busy. Please try again in a minute.";
  if (msg.includes("400"))
    return "The generation request was rejected. Please try again.";
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED"))
    return "Network error. Please check your connection and try again.";

  // If the message is short and clean, pass it through
  if (msg.length < 120 && !msg.includes("{")) return msg;

  return "Something went wrong during contract generation. Please try again.";
}

// ─── System prompt ───────────────────────────────────────────────────────────

function getLengthGuidance(contractLength: string): string {
  switch (contractLength) {
    case "concise":
      return `**Length**: Keep the contract CONCISE — approximately 2-4 printed pages. Include only essential terms. Combine related clauses. Skip boilerplate that isn't critical for this contract type. Prioritize clarity and brevity.`;
    case "comprehensive":
      return `**Length**: Generate a COMPREHENSIVE contract — approximately 7-10 printed pages maximum. Include all standard sections with detailed sub-clauses. NEVER exceed 10 pages.`;
    default:
      return `**Length**: Generate a STANDARD-length contract — approximately 4-7 printed pages. Include all important sections with reasonable detail. Don't pad with unnecessary boilerplate.`;
  }
}

function buildSystemPrompt(language: string, contractLength: string): string {
  return `You are an expert contract attorney with decades of experience drafting, reviewing, and stress-testing legal agreements across multiple jurisdictions. Your contracts have withstood rigorous legal challenges.

Generate a complete, professional, ready-to-sign contract based on the user's specifications. Follow these requirements:

1. **Structure**: Use clear numbered sections (1, 1.1, 1.2, etc.) with descriptive headings. Include:
   - Title and date
   - Recitals / Background
   - Definitions
   - Core terms specific to the contract type
   - Representations and warranties
   - Indemnification
   - Limitation of liability
   - Confidentiality (where applicable)
   - Intellectual property ownership (where applicable)
   - Term and termination
   - Dispute resolution (arbitration/mediation/litigation as appropriate for the jurisdiction)
   - Force majeure
   - General provisions (severability, entire agreement, amendments, notices, assignment, waiver)
   - Signature blocks for both parties (see point 5)

2. ${getLengthGuidance(contractLength)}

3. **Quality Standards**:
   - Use clear but legally precise language
   - Include specific cross-references between sections (e.g., "as defined in Section 2.3")
   - Ensure protective clauses for BOTH parties — the contract should be balanced
   - Stress-test against common legal challenges: ambiguous terms, missing edge cases, unenforceable clauses
   - Be jurisdiction-aware — reference applicable laws and standards for the specified jurisdiction
   - Include reasonable default values for liability caps, notice periods, and cure periods

4. **Formatting**:
   - Use Markdown formatting for readability
   - Use **bold** for section headings
   - Use numbered/lettered lists for sub-clauses
   - Include blank lines between sections for clarity

5. **Signature Block**: End the contract with a proper signature section. Use this exact format:

---

## SIGNATURES

**IN WITNESS WHEREOF**, the Parties have executed this Agreement as of the date first written above.

**[Party A Name]**

Signature: _________________________

Printed Name: _________________________

Title: _________________________

Date: _________________________

**[Party B Name]**

Signature: _________________________

Printed Name: _________________________

Title: _________________________

Date: _________________________

6. **Language**: Generate the entire contract in ${language}.

Do NOT include any commentary, explanations, or notes outside the contract text itself. Output ONLY the contract document.`;
}

function buildUserPrompt(
  contractType: string,
  partyA: string,
  partyB: string,
  jurisdiction: string,
  keyTerms: string,
  companyWebsite?: string,
): string {
  const companyContext = companyWebsite
    ? `\n\n**Company Website:** ${companyWebsite}\nUse this to infer the company's industry, business model, and appropriate professional tone. Tailor the contract language and specific clauses to match the company's sector and typical business practices.`
    : "";

  return `Generate a ${contractType} contract with the following details:

**Party A (First Party):** ${partyA}
**Party B (Second Party):** ${partyB}
**Jurisdiction:** ${jurisdiction}${companyContext}

**Key Terms and Requirements:**
${keyTerms}

Generate the complete contract now.`;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { contractType, partyA, partyB, jurisdiction, keyTerms, language, contractLength, companyWebsite, privacyMode } =
    parsed.data;

  const client = getAnthropicClient(privacyMode);

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (chunk: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(chunk));
        } catch {
          // Stream already closed
        }
      };

      try {
        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: buildSystemPrompt(language, contractLength),
          messages: [
            {
              role: "user",
              content: buildUserPrompt(contractType, partyA, partyB, jurisdiction, keyTerms, companyWebsite),
            },
          ],
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            emit(sseEvent({ type: "delta", text: event.delta.text }));
          }
        }

        emit(sseDone());
      } catch (err) {
        emit(
          sseEvent({
            type: "error",
            message: sanitizeErrorMessage(err),
          })
        );
        emit(sseDone());
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
