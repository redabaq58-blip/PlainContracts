import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { getBoilerplate } from "@/constants/clauseDatabase";

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
   - General provisions (severability, entire agreement, amendments, notices, assignment, waiver)
   - Signature blocks for both parties (see point 5)

2. ${getLengthGuidance(contractLength)}

3. **Quality Standards**:
   - Use clear but legally precise language
   - Use objective performance metrics — NEVER use "best efforts" or "reasonable endeavours" for core obligations. Use measurable standards (e.g., "within 5 Business Days", "not less than 99.5% uptime").
   - Use "shall" for mandatory obligations and "may" for discretionary rights. Active voice throughout.
   - Include specific cross-references between sections (e.g., "as defined in Section 2.3")
   - Ensure protective clauses for BOTH parties — the contract should be balanced
   - Include a mutual limitation of liability cap referenced to the contract value
   - Be jurisdiction-aware — reference applicable laws and standards for the specified jurisdiction
   - Include reasonable default values for notice periods and cure periods

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
  companyWebsite?: string
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

// ─── Hostile Review (hidden from user) ───────────────────────────────────────

interface HostileReviewResult {
  loophole: string;
  fix: string;
  clauseToAdd: string;
}

async function runHostileReview(
  contractText: string,
  privacyMode: boolean
): Promise<HostileReviewResult | null> {
  const client = getAnthropicClient(privacyMode);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are hostile counsel hired to find a loophole in this contract. Find ONE specific, exploitable legal loophole that would allow a party to breach their core obligations without paying damages. Return ONLY a JSON object:
{
  "loophole": "One sentence describing the specific exploitable gap",
  "fix": "One sentence describing the clause language that closes this gap",
  "clauseToAdd": "The complete clause text to add or modify, written in professional legal language"
}
If no exploitable loophole exists, return: { "loophole": "", "fix": "", "clauseToAdd": "" }`,
      messages: [
        {
          role: "user",
          content: `Find a loophole in this contract:\n\n${contractText.slice(0, 8000)}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.loophole === "string" &&
      typeof parsed.fix === "string" &&
      typeof parsed.clauseToAdd === "string"
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

async function applyHostileFix(
  contractText: string,
  loophole: string,
  clauseToAdd: string,
  privacyMode: boolean
): Promise<string> {
  const client = getAnthropicClient(privacyMode);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: `You are a contract editor. You will receive a contract and a clause to add. Insert the clause in the most appropriate section of the contract. Return the COMPLETE contract text with the fix applied. Maintain all existing formatting and structure. Do not add any commentary.`,
      messages: [
        {
          role: "user",
          content: `CONTRACT:
${contractText}

LOOPHOLE IDENTIFIED: ${loophole}

CLAUSE TO INSERT:
${clauseToAdd}

Return the complete contract with this clause inserted in the appropriate section.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return text || contractText;
  } catch {
    return contractText;
  }
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

  const {
    contractType,
    partyA,
    partyB,
    jurisdiction,
    keyTerms,
    language,
    contractLength,
    companyWebsite,
    privacyMode,
  } = parsed.data;

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
        // ── Step 1: Generate contract draft ──────────────────────────────────
        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: buildSystemPrompt(language, contractLength),
          messages: [
            {
              role: "user",
              content: buildUserPrompt(
                contractType,
                partyA,
                partyB,
                jurisdiction,
                keyTerms,
                companyWebsite
              ),
            },
          ],
        });

        let fullContractText = "";

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            emit(sseEvent({ type: "delta", text: event.delta.text }));
            fullContractText += event.delta.text;
          }
        }

        // ── Step 2: Inject jurisdiction-specific boilerplate ─────────────────
        const boilerplate = getBoilerplate(jurisdiction);
        if (
          boilerplate &&
          !fullContractText.toLowerCase().includes("force majeure")
        ) {
          // Insert boilerplate before the signature block
          const sigIdx = fullContractText.lastIndexOf("---\n\n## SIGNATURES");
          if (sigIdx !== -1) {
            fullContractText =
              fullContractText.slice(0, sigIdx) +
              "\n---\n\n## STANDARD PROTECTIVE PROVISIONS\n\n" +
              boilerplate.trim() +
              "\n\n" +
              fullContractText.slice(sigIdx);
          } else {
            fullContractText += "\n\n---\n\n## STANDARD PROTECTIVE PROVISIONS\n\n" + boilerplate.trim();
          }
          // Emit the injected boilerplate as a delta
          emit(sseEvent({ type: "delta", text: "\n\n---\n\n## STANDARD PROTECTIVE PROVISIONS\n\n" + boilerplate.trim() }));
        }

        // ── Step 3: Hostile Review (hidden, 20s timeout) ─────────────────────
        emit(sseEvent({ type: "hostile_review", status: "checking" }));

        const TIMEOUT_RESULT = null;
        const hostileResult = await Promise.race([
          runHostileReview(fullContractText, privacyMode),
          new Promise<null>((resolve) => setTimeout(() => resolve(TIMEOUT_RESULT), 20_000)),
        ]);

        if (hostileResult && hostileResult.loophole && hostileResult.clauseToAdd) {
          // Apply the fix
          const fixedContract = await Promise.race([
            applyHostileFix(
              fullContractText,
              hostileResult.loophole,
              hostileResult.clauseToAdd,
              privacyMode
            ),
            new Promise<string>((resolve) =>
              setTimeout(() => resolve(fullContractText), 15_000)
            ),
          ]);

          if (fixedContract !== fullContractText) {
            // Replace the contract with the fixed version (send a full reset + re-emit)
            emit(sseEvent({ type: "contract_reset", text: fixedContract }));
          }

          emit(
            sseEvent({
              type: "hostile_review",
              status: "fixed",
              count: 1,
            })
          );
        } else {
          emit(sseEvent({ type: "hostile_review", status: "clean" }));
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
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked",
    },
  });
}
