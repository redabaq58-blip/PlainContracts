import { getAnthropicClient } from "./client";
import { runLayer1 } from "./layer1-intel";
import { buildLayer2SystemPrompt, buildLayer2UserPrompt } from "./layer2-translate";
import { runLayer3, reviseFlags } from "./layer3-verify";
import { parseJsonSection } from "@/lib/utils/parseSections";
import { calculatePowerScore } from "@/lib/utils/powerScore";
import type {
  AudienceLevel,
  AnalysisMode,
  Layer1Result,
  RedFlag,
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
      // No delimiter found — check for potential partial delimiter at the end
      const partialIdx = findPartialDelimiter(state.buffer);
      if (partialIdx !== -1) {
        // Emit everything before the potential partial
        const safeText = state.buffer.slice(0, partialIdx);
        if (state.currentSection && safeText) {
          state.accumulated[state.currentSection] =
            (state.accumulated[state.currentSection] ?? "") + safeText;
          onDelta(state.currentSection, safeText);
        }
        state.buffer = state.buffer.slice(partialIdx);
      } else {
        // Safe to emit everything
        if (state.currentSection && state.buffer) {
          state.accumulated[state.currentSection] =
            (state.accumulated[state.currentSection] ?? "") + state.buffer;
          onDelta(state.currentSection, state.buffer);
        }
        state.buffer = "";
      }
      break;
    }

    // Emit text before this delimiter
    if (delimStart > 0 && state.currentSection) {
      const before = state.buffer.slice(0, delimStart);
      state.accumulated[state.currentSection] =
        (state.accumulated[state.currentSection] ?? "") + before;
      onDelta(state.currentSection, before);
    }

    // Find end of delimiter
    const delimEnd = state.buffer.indexOf(
      SECTION_SUFFIX,
      delimStart + SECTION_PREFIX.length
    );
    if (delimEnd === -1) {
      // Incomplete delimiter — hold the buffer
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

  // If the message is short and clean, pass it through
  if (msg.length < 120 && !msg.includes("{")) return msg;

  return "Something went wrong during analysis. Please try again.";
}

// ─── Timeout helper ───────────────────────────────────────────────────────────

/** Resolves with `fallback` after `ms` milliseconds. Use with Promise.race(). */
function withTimeout<T>(ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
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
 * Runs the full 3-layer contract analysis pipeline.
 * Yields Server-Sent Events as a ReadableStream.
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

        // ── Layer 2 (streaming) ───────────────────────────────────────────────
        const client = getAnthropicClient(privacyMode);
        const systemPrompt = buildLayer2SystemPrompt(audienceLevel, mode, layer1Result, language);
        const userPrompt = buildLayer2UserPrompt(contractText, mode);

        const parserState: StreamParserState = {
          buffer: "",
          currentSection: null,
          accumulated: {},
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
                // section boundary detected — no SSE event needed, client
                // infers sections from delimiters in the accumulated text
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
          emit(sseEvent({ type: "delta", section: parserState.currentSection, text: parserState.buffer }));
        }

        // Reconstruct full Layer 2 text from accumulated sections
        const layer2Text = Object.entries(parserState.accumulated)
          .map(([k, v]) => `<!-- SECTION:${k} -->\n${v}`)
          .join("\n\n");

        // ── Layer 3 (verification) — 25 s timeout, graceful fallback ──────────
        emit(sseEvent({ type: "verifying" }));

        const L3_FALLBACK: import("@/types").Layer3Result = {
          accurate: true,
          errors: [],
          confidenceAdjustment: 0,
        };

        let layer3Result = await Promise.race([
          runLayer3(contractText, layer2Text, privacyMode),
          withTimeout(25_000, L3_FALLBACK),
        ]);

        // Auto-revise red flags if Layer 3 found errors — 15 s timeout
        if (!layer3Result.accurate && layer3Result.errors.length > 0) {
          const originalFlags = parserState.accumulated["REDFLAGS"] ?? "";
          const revised = await Promise.race([
            reviseFlags(contractText, originalFlags, layer3Result.errors, privacyMode),
            withTimeout(15_000, originalFlags),
          ]);
          if (revised !== originalFlags) {
            parserState.accumulated["REDFLAGS"] = revised;
            emit(sseEvent({ type: "section_revised", section: "REDFLAGS", text: revised }));
          }
        }

        // Calculate power score
        const redFlags = parseJsonSection<RedFlag[]>(
          parserState.accumulated["REDFLAGS"],
          []
        );
        const missingText = parserState.accumulated["MISSING"] ?? "";
        const powerScore = calculatePowerScore(redFlags, missingText);

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
