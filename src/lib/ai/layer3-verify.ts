import { getAnthropicClient } from "./client";
import type { Layer3Error } from "@/types";

/**
 * Layer 3 — Flag Revision
 *
 * When the inline flag verification (in pipeline.ts) detects hallucinated clause
 * references, this function corrects the REDFLAGS JSON using Haiku.
 *
 * The full stress test engine is in layer3-stress.ts.
 */
export async function reviseFlags(
  contractText: string,
  originalFlags: string,
  errors: Layer3Error[],
  privacyMode = false
): Promise<string> {
  const client = getAnthropicClient(privacyMode);

  const errorSummary = errors
    .map((e, i) => `${i + 1}. ${e.description} → ${e.correction}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You are a contract analysis editor. You will be given a JSON array of red flags and a list of corrections. Return the corrected JSON array only, with no surrounding text or markdown fences.",
      messages: [
        {
          role: "user",
          content: `Original red flags:
${originalFlags.slice(0, 2000)}

CONTRACT (first 3000 chars):
${contractText.slice(0, 3000)}

Required corrections:
${errorSummary}

Return the corrected JSON array of red flags. Remove any flags that cannot be verified in the contract text. Keep valid flags unchanged.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    // Validate it's parseable JSON
    JSON.parse(text);
    return text;
  } catch {
    return originalFlags;
  }
}
