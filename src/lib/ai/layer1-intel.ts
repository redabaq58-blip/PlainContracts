import { getAnthropicClient } from "./client";
import type { Layer1Result } from "@/types";

const FALLBACK: Layer1Result = {
  contractType: "unknown",
  jurisdiction: "Not stated",
  signerRole: "Party",
  counterpartyRole: "Other Party",
  isComplete: true,
  completenessNote: "",
  confidence: 50,
};

/**
 * Layer 1 — Contract Intelligence
 * Uses Claude Haiku to detect contract metadata: type, jurisdiction, party roles, completeness.
 * Returns structured JSON used to personalise Layer 2 output.
 */
export async function runLayer1(
  contractText: string,
  privacyMode = false
): Promise<Layer1Result> {
  const client = getAnthropicClient(privacyMode);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a contract classification expert. Analyse the provided contract and return ONLY a JSON object with no surrounding text or markdown.

Required JSON shape:
{
  "contractType": "one of: employment | lease | NDA | freelance | service | partnership | loan | other",
  "jurisdiction": "state/country if stated, or 'Not stated'",
  "signerRole": "role of the person expected to sign (e.g. Employee, Tenant, Contractor, Licensee)",
  "counterpartyRole": "role of the other party (e.g. Employer, Landlord, Client, Licensor)",
  "isComplete": true or false (false if this appears to be an excerpt or draft),
  "completenessNote": "short note if incomplete, empty string otherwise",
  "confidence": number 0-100 (how confident you are in your classification)
}`,
      messages: [
        {
          role: "user",
          content: `Classify this contract:\n\n${contractText.slice(0, 4000)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    if (
      typeof parsed.contractType === "string" &&
      typeof parsed.jurisdiction === "string" &&
      typeof parsed.signerRole === "string" &&
      typeof parsed.counterpartyRole === "string" &&
      typeof parsed.isComplete === "boolean" &&
      typeof parsed.confidence === "number"
    ) {
      return parsed as Layer1Result;
    }

    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
