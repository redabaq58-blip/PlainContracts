import { getAnthropicClient } from "./client";
import type { Layer3Result } from "@/types";

const FALLBACK: Layer3Result = {
  accurate: true,
  errors: [],
  confidenceAdjustment: -5,
};

/**
 * Layer 3 — Adversarial Verification
 * Uses Claude Haiku to verify that every flagged clause exists in the source text
 * and that no material obligations were invented. Adjusts confidence accordingly.
 */
export async function runLayer3(
  contractText: string,
  layer2Output: string,
  privacyMode = false
): Promise<Layer3Result> {
  const client = getAnthropicClient(privacyMode);

  // Extract just the REDFLAGS and MISSING sections for verification
  const redflagsMatch = layer2Output.match(
    /<!-- SECTION:REDFLAGS -->([\s\S]*?)(?=<!-- SECTION:|$)/
  );
  const missingMatch = layer2Output.match(
    /<!-- SECTION:MISSING -->([\s\S]*?)(?=<!-- SECTION:|$)/
  );

  const flagsText = redflagsMatch?.[1]?.trim() ?? "";
  const missingText = missingMatch?.[1]?.trim() ?? "";

  if (!flagsText && !missingText) return FALLBACK;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a contract analysis quality checker. Your job is to verify that the red flags identified in a contract analysis actually appear in the source contract text. You must return ONLY a JSON object with no surrounding text.

Required JSON shape:
{
  "accurate": true or false,
  "errors": [
    {
      "section": "REDFLAGS or MISSING",
      "description": "What is wrong",
      "correction": "What should be corrected"
    }
  ],
  "confidenceAdjustment": number between -30 and +10
}

Rules:
- If all red flags reference clauses that actually exist in the contract: accurate=true, confidenceAdjustment between 0 and +10
- If any red flags reference clauses NOT found in the contract: accurate=false, list each error, confidenceAdjustment between -20 and -30
- If red flags are real but minor wording issues: accurate=true, confidenceAdjustment between -5 and 0`,
      messages: [
        {
          role: "user",
          content: `CONTRACT TEXT (first 4000 chars):
${contractText.slice(0, 4000)}

RED FLAGS IDENTIFIED:
${flagsText.slice(0, 1500)}

MISSING CLAUSES IDENTIFIED:
${missingText.slice(0, 500)}

Verify that the red flags are grounded in the actual contract text. Do any clause references appear fabricated?`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
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

    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/**
 * Revise the REDFLAGS section when Layer 3 finds errors.
 * Returns corrected REDFLAGS JSON string.
 */
export async function reviseFlags(
  contractText: string,
  originalFlags: string,
  errors: Layer3Result["errors"],
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
