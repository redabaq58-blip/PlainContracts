import { getAnthropicClient } from "./client";
import { runLayer1 } from "./layer1-intel";
import { runLayer2Agents } from "./layer2-agents";
import { buildLayer2SystemPrompt, buildLayer2UserPrompt } from "./layer2-translate";
import { reviseFlags } from "./layer3-verify";
import { runStressTests } from "./layer3-stress";
import { parseJsonSection } from "@/lib/utils/parseSections";
import { calculatePowerScore } from "@/lib/utils/powerScore";
import type {
  AudienceLevel,
  AnalysisMode,
  Layer1Result,
  Layer3Result,
  RedFlag,
  StressTestResult,
} from "@/types";

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseDone(): string {
  return `done: true\n\n`;
}

// ─── Section parser (mid-stream) ──────────────────────────────────────────────

const SECTION_PREFIX = "<!-- SECTION:";
const SECTION_SUFFIX = " -->";

interface StreamParserState {
  buffer: string;
  currentSection: string | null;
  accumulated: Record<string, string>;
}

function processChunk(
  state: StreamParserState,
  chunk: string,
  onDelta: (section: string, text: string) => void,
  onSection: (section: string) => void
): void {
  state.buffer += chunk;

  while (true) {
    const delimStart = state.buffer.indexOf(SECTION_PREFIX);

    if (delimStart === -1) {
      const partialIdx = findPartialDelimiter(state.buffer);
      if (partialIdx !== -1) {
        const safeText = state.buffer.slice(0, partialIdx);
        if (state.currentSection && safeText) {
          state.accumulated[state.currentSection] =
            (state.accumulated[state.currentSection] ?? "") + safeText;
          onDelta(state.currentSection, safeText);
        }
        state.buffer = state.buffer.slice(partialIdx);
      } else {
        if (state.currentSection && state.buffer) {
          state.accumulated[state.currentSection] =
            (state.accumulated[state.currentSection] ?? "") + state.buffer;
          onDelta(state.currentSection, state.buffer);
        }
        state.buffer = "";
      }
      break;
    }

    if (delimStart > 0 && state.currentSection) {
      const before = state.buffer.slice(0, delimStart);
      state.accumulated[state.currentSection] =
        (state.accumulated[state.currentSection] ?? "") + before;
      onDelta(state.currentSection, before);
    }

    const delimEnd = state.buffer.indexOf(
      SECTION_SUFFIX,
      delimStart + SECTION_PREFIX.length
    );
    if (delimEnd === -1) {
      state.buffer = state.buffer.slice(delimStart);
      break;
    }

    const sectionName = state.buffer.slice(
      delimStart + SECTION_PREFIX.length,
      delimEnd
    );
    state.currentSection = sectionName;
    state.accumulated[sectionName] = state.accumulated[sectionName] ?? "";
    onSection(sectionName);
    state.buffer = state.buffer.slice(delimEnd + SECTION_SUFFIX.length);
  }
}

function findPartialDelimiter(text: string): number {
  for (let i = 1; i < SECTION_PREFIX.length; i++) {
    if (text.endsWith(SECTION_PREFIX.slice(0, i))) {
      return text.length - i;
    }
  }
  return -1;
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
    return "The analysis request was rejected. Please try again.";
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED"))
    return "Network error. Please check your connection and try again.";

  if (msg.length < 120 && !msg.includes("{")) return msg;

  return "Something went wrong during analysis. Please try again.";
}

// ─── Timeout helper ───────────────────────────────────────────────────────────

function withTimeout<T>(ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
}

// ─── Inline flag verification (lightweight Haiku check) ───────────────────────

async function verifyFlags(
  contractText: string,
  flagsText: string,
  missingText: string,
  privacyMode: boolean
): Promise<{ accurate: boolean; errors: Array<{ section: string; description: string; correction: string }>; confidenceAdjustment: number }> {
  const client = getAnthropicClient(privacyMode);

  if (!flagsText && !missingText) {
    return { accurate: true, errors: [], confidenceAdjustment: 0 };
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a contract analysis quality checker. Verify that red flags identified in a contract analysis actually appear in the source contract text. Return ONLY a JSON object.

Required JSON shape:
{
  "accurate": true or false,
  "errors": [
    { "section": "REDFLAGS or MISSING", "description": "What is wrong", "correction": "What should be corrected" }
  ],
  "confidenceAdjustment": number between -30 and +10
}

Rules:
- If all red flags reference clauses that actually exist in the contract: accurate=true, confidenceAdjustment 0 to +10
- If any red flags reference clauses NOT found in the contract: accurate=false, list each error, confidenceAdjustment -20 to -30
- If red flags are real but minor wording issues: accurate=true, confidenceAdjustment -5 to 0`,
      messages: [
        {
          role: "user",
          content: `CONTRACT TEXT (first 4000 chars):\n${contractText.slice(0, 4000)}\n\nRED FLAGS IDENTIFIED:\n${flagsText.slice(0, 1500)}\n\nMISSING CLAUSES IDENTIFIED:\n${missingText.slice(0, 500)}\n\nVerify that the red flags are grounded in the actual contract text.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    if (
      typeof parsed.accurate === "boolean" &&
      Array.isArray(parsed.errors) &&
      typeof parsed.confidenceAdjustment === "number"
    ) {
      return {
        accurate: parsed.accurate,
        errors: parsed.errors,
        confidenceAdjustment: Math.max(-30, Math.min(10, parsed.confidenceAdjustment)),
      };
    }

    return { accurate: true, errors: [], confidenceAdjustment: 0 };
  } catch {
    return { accurate: true, errors: [], confidenceAdjustment: 0 };
  }
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export interface PipelineOptions {
  contractText: string;
  audienceLevel: AudienceLevel;
  mode: AnalysisMode;
  privacyMode?: boolean;
  layer1Cache?: Layer1Result;
  language?: string;
}

/**
 * V2 Pipeline — Parallel Extraction + Synthesis + Senior Partner Stress Tests.
 *
 * Flow:
 *   Layer 1 (Haiku)            → contract classification + void risk
 *   Layer 2A/B/C (Haiku x3)   → parallel extraction of OBLIGATIONS, TIMELINE, POWERS
 *   Layer 2 Synthesis (Sonnet) → SUMMARY, REDFLAGS, MISSING, CONFIDENCE (streaming)
 *   Layer 3 Stress (Sonnet)    → 5 structural stress tests
 *   Layer 3 Verify (Haiku)     → flag grounding check + auto-revision
 */
export function encodePipelineStream(options: PipelineOptions): ReadableStream {
  const {
    contractText,
    audienceLevel,
    mode,
    privacyMode = false,
    layer1Cache,
    language = "English",
  } = options;

  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (data: string) => controller.enqueue(enc.encode(data));

      try {
        // ── Layer 1 ──────────────────────────────────────────────────────────
        let layer1Result: Layer1Result;

        if (layer1Cache) {
          layer1Result = layer1Cache;
        } else {
          layer1Result = await runLayer1(contractText, privacyMode);
        }

        emit(sseEvent({ type: "layer1", result: layer1Result }));

        // ── Layer 2 Parallel Agents (A: Obligations, B: Timeline, C: Powers) ─
        emit(sseEvent({ type: "layer2_parallel_start" }));

        const agentResults = await runLayer2Agents(
          contractText,
          layer1Result,
          mode,
          privacyMode
        );

        // Emit each extracted section as delta events so the UI renders them immediately
        if (agentResults.obligations) {
          emit(sseEvent({ type: "delta", section: "OBLIGATIONS", text: agentResults.obligations }));
        }
        if (agentResults.timeline) {
          emit(sseEvent({ type: "delta", section: "TIMELINE", text: agentResults.timeline }));
        }
        if (agentResults.powers) {
          emit(sseEvent({ type: "delta", section: "POWERS", text: agentResults.powers }));
        }

        emit(sseEvent({ type: "layer2_parallel_done" }));

        // ── Layer 2 Synthesis (streaming Sonnet) — SUMMARY, REDFLAGS, MISSING, CONFIDENCE ──
        emit(sseEvent({ type: "layer2_synthesis" }));

        const client = getAnthropicClient(privacyMode);
        const systemPrompt = buildLayer2SystemPrompt(audienceLevel, mode, layer1Result, language);
        const userPrompt = buildLayer2UserPrompt(
          contractText,
          mode,
          agentResults.obligations,
          agentResults.timeline,
          agentResults.powers
        );

        const parserState: StreamParserState = {
          buffer: "",
          currentSection: null,
          accumulated: {
            // Pre-populate agent sections so they're available for power score calculation
            OBLIGATIONS: agentResults.obligations,
            TIMELINE: agentResults.timeline,
            POWERS: agentResults.powers,
          },
        };

        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const settle = (fn: () => void) => {
            if (settled) return;
            settled = true;
            fn();
          };

          stream.on("text", (text: string) => {
            processChunk(
              parserState,
              text,
              (section, delta) => {
                emit(sseEvent({ type: "delta", section, text: delta }));
              },
              (_section) => {
                // section boundary detected — client infers from delimiters
              }
            );
          });

          stream.on("error", (err: Error) => settle(() => reject(err)));
          stream.on("finalMessage", () => settle(() => resolve()));
        });

        // Flush remaining buffer
        if (parserState.buffer && parserState.currentSection) {
          parserState.accumulated[parserState.currentSection] =
            (parserState.accumulated[parserState.currentSection] ?? "") +
            parserState.buffer;
          emit(
            sseEvent({
              type: "delta",
              section: parserState.currentSection,
              text: parserState.buffer,
            })
          );
        }

        // Build synthesis text for Layer 3 context
        const synthesisText = ["SUMMARY", "REDFLAGS", "MISSING", "CONFIDENCE"]
          .map((k) =>
            parserState.accumulated[k]
              ? `<!-- SECTION:${k} -->\n${parserState.accumulated[k]}`
              : ""
          )
          .filter(Boolean)
          .join("\n\n");

        // ── Layer 3: Stress Tests (Sonnet) + Flag Verification (Haiku) ───────
        emit(sseEvent({ type: "verifying" }));

        const STRESS_FALLBACK: StressTestResult[] = [];
        const VERIFY_FALLBACK = { accurate: true, errors: [], confidenceAdjustment: 0 };

        const [stressTests, verification] = await Promise.all([
          Promise.race([
            runStressTests(contractText, synthesisText, mode, privacyMode),
            withTimeout(30_000, STRESS_FALLBACK),
          ]),
          Promise.race([
            verifyFlags(
              contractText,
              parserState.accumulated["REDFLAGS"] ?? "",
              parserState.accumulated["MISSING"] ?? "",
              privacyMode
            ),
            withTimeout(20_000, VERIFY_FALLBACK),
          ]),
        ]);

        // Auto-revise red flags if verification found hallucinated clauses
        if (!verification.accurate && verification.errors.length > 0) {
          const originalFlags = parserState.accumulated["REDFLAGS"] ?? "";
          const revised = await Promise.race([
            reviseFlags(contractText, originalFlags, verification.errors, privacyMode),
            withTimeout(15_000, originalFlags),
          ]);
          if (revised !== originalFlags) {
            parserState.accumulated["REDFLAGS"] = revised;
            emit(
              sseEvent({ type: "section_revised", section: "REDFLAGS", text: revised })
            );
          }
        }

        // ── PowerScore ───────────────────────────────────────────────────────
        const redFlags = parseJsonSection<RedFlag[]>(
          parserState.accumulated["REDFLAGS"],
          []
        );
        const missingText = parserState.accumulated["MISSING"] ?? "";
        const powerScore = calculatePowerScore(redFlags, missingText, stressTests);

        const layer3Result: Layer3Result = {
          accurate: verification.accurate,
          errors: verification.errors,
          confidenceAdjustment: verification.confidenceAdjustment,
          stressTests,
        };

        emit(sseEvent({ type: "layer3", result: layer3Result, powerScore }));
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
}
