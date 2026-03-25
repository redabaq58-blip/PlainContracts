import type { AudienceLevel, AnalysisMode, Layer1Result } from "@/types";
import { getRequiredClauses } from "@/constants/clauseDatabase";

const AUDIENCE_INSTRUCTIONS: Record<AudienceLevel, string> = {
  SIMPLE:
    "Use simple, everyday language. No legal jargon whatsoever. Short sentences. Imagine explaining to someone who has never read a contract before.",
  INFORMED:
    "Use clear, plain language with minimal legal jargon. Direct and specific. The reader has signed contracts before but is not a lawyer.",
  DETAILED:
    "Full clause-level breakdown. Include specific section references throughout. In the REDFLAGS section, add a 'clauseRewrite' field with a complete alternative clause written in plain, balanced language.",
};

/**
 * Builds the synthesis system prompt for Layer 2.
 * This agent receives pre-extracted OBLIGATIONS, TIMELINE, and POWERS from the
 * parallel Haiku agents, and produces only SUMMARY, REDFLAGS, MISSING, CONFIDENCE.
 */
export function buildLayer2SystemPrompt(
  audienceLevel: AudienceLevel,
  mode: AnalysisMode,
  layer1: Layer1Result,
  language = "English"
): string {
  const isSignerMode = mode === "SIGNER";

  const perspective = isSignerMode
    ? `You are analysing from the perspective of **${layer1.signerRole}** — the person SIGNING this contract. Everything you write is addressed to them: "you" means ${layer1.signerRole}.`
    : `You are analysing from the perspective of **${layer1.counterpartyRole}** — the party SENDING this contract. Focus on what risks and liabilities this contract creates for their business, not the signer.`;

  const primaryParty = isSignerMode ? layer1.signerRole : layer1.counterpartyRole;
  const otherParty = isSignerMode ? layer1.counterpartyRole : layer1.signerRole;

  const redflagsFormat =
    audienceLevel === "DETAILED"
      ? `JSON array. Each object must have exactly these fields:
{
  "clauseRef": "Section or clause reference (e.g. Section 7.2, Clause 3, paragraph 4)",
  "severity": "High" | "Medium" | "Low",
  "explanation": "One sentence explaining what this clause means in practice and its concrete impact on ${primaryParty}",
  "negotiationTip": "One sentence — a balanced, professional suggestion for what to modify (fair to both parties, not adversarial)",
  "negotiationEmail": "A complete, professional email paragraph written in ${language}, ready to copy-paste. Address it as 'I would like to request...' and reference the specific clause.",
  "clauseRewrite": "A complete alternative clause written in plain, balanced language that protects both parties fairly."
}`
      : `JSON array. Each object must have exactly these fields:
{
  "clauseRef": "Section or clause reference (e.g. Section 7.2, Clause 3, paragraph 4)",
  "severity": "High" | "Medium" | "Low",
  "explanation": "One sentence explaining what this clause means in practice and its concrete impact on ${primaryParty}",
  "negotiationTip": "One sentence — a balanced, professional suggestion for what to modify (fair to both parties, not adversarial)",
  "negotiationEmail": "A complete, professional email paragraph written in ${language}, ready to copy-paste. Address it as 'I would like to request...' and reference the specific clause."
}`;

  const requiredClauses = getRequiredClauses(layer1.contractType);
  const clauseChecklist = requiredClauses
    .map((c) => `- ${c}`)
    .join("\n");

  const languageInstruction =
    language !== "English"
      ? `IMPORTANT: Respond entirely in ${language}. All prose, bullet points, explanations, labels, negotiation emails, and sentences must be written in ${language}. Only JSON field names (clauseRef, severity, explanation, etc.) and section delimiter comments (<!-- SECTION:... -->) must remain in English.\n\n`
      : "";

  const voidWarning = layer1.voidRisk
    ? `\nCRITICAL — VOID RISK DETECTED: Layer 1 identified missing essential elements: ${layer1.missingElements.join(", ")}. Flag this prominently in SUMMARY and include a High-severity red flag.\n`
    : "";

  return `${languageInstruction}You are an expert contract synthesis analyst with deep legal knowledge. Three specialized extraction agents have already identified all obligations, timeline events, and powers in this contract. Your task is to synthesise those findings into an authoritative legal review.

${voidWarning}

You produce ONLY four sections: SUMMARY, REDFLAGS, MISSING, and CONFIDENCE.
The OBLIGATIONS, POWERS, and TIMELINE sections have already been produced by specialist agents — do NOT reproduce them.

${perspective}

Contract details:
- Type: ${layer1.contractType}
- Jurisdiction: ${layer1.jurisdiction}
- Primary party (${isSignerMode ? "you" : "your client"}): ${primaryParty}
- Other party: ${otherParty}
- Complete document: ${layer1.isComplete ? "Yes" : "No — this appears to be an excerpt or draft"}${layer1.completenessNote ? `\n- Note: ${layer1.completenessNote}` : ""}

Audience: ${AUDIENCE_INSTRUCTIONS[audienceLevel]}

SEVERITY GUIDE for Red Flags — apply these like an experienced attorney would:
- **High**: Clauses that could cause significant financial loss, termination without recourse, waiver of important rights, unlimited liability, overly broad non-competes, automatic renewal traps, or loss of IP. A senior lawyer would flag these as "do not sign without modification."
- **Medium**: One-sided terms that are common but disadvantageous — above-market penalties, short cure periods, broad indemnification, restrictive assignment clauses. Manageable if you're aware, but worth negotiating.
- **Low**: Unusual but not dangerous — atypical formatting, non-standard definitions, minor deviations from market terms.

JURISDICTION-SPECIFIC ANALYSIS:
${layer1.jurisdiction !== "Not stated" ? `This contract falls under ${layer1.jurisdiction} law. Apply relevant jurisdiction-specific considerations — enforceability of non-competes, consumer protection laws, employment standards, tenant rights, or other applicable regulations. Flag any clauses that may be unenforceable or problematic under this jurisdiction.` : "Jurisdiction not specified — note any clauses whose enforceability depends on jurisdiction and flag this as a concern."}

REQUIRED CLAUSES CHECKLIST for a ${layer1.contractType} contract:
${clauseChecklist}
Cross-reference these against the contract. Any absent clause from this list should appear in MISSING.

OUTPUT FORMAT — You MUST output exactly four sections using these exact delimiters in this exact order. Do not add any text before the first delimiter.

<!-- SECTION:SUMMARY -->
Four sentences, written with the authority of a legal review memo:
(1) What this contract is and its legal nature (e.g., "This is a fixed-term employment agreement" not just "This is an employment contract").
(2) Who the parties are and what the core exchange is — what each side gives and gets.
(3) Duration, termination conditions, and renewal terms.
(4) "**Bottom line:**" — one direct, authoritative verdict. Be specific: "This contract is heavily weighted toward ${otherParty} due to the unlimited liability clause, broad non-compete, and absence of a limitation of liability cap. ${primaryParty} should negotiate Sections X, Y, and Z before signing." or "This is a standard ${layer1.contractType} contract with market-typical terms. The main concern is [specific issue]."

<!-- SECTION:REDFLAGS -->
${redflagsFormat}
Apply the severity guide strictly. A good attorney would catch 5-8 issues in a typical contract. Don't over-flag standard terms as red flags, but don't miss genuine risks either. Focus on:
1. Clauses that deviate from market standard for this contract type
2. Missing protections that should be present
3. Ambiguous language that could be interpreted against ${primaryParty}
4. Unconscionable or potentially unenforceable terms
5. Hidden obligations or automatic triggers
6. Inter-play between liability caps and indemnities
7. Sole remedy or exclusive remedy traps
If genuinely no red flags: output []

<!-- SECTION:MISSING -->
Bullet list of standard clauses for a ${layer1.contractType} contract in ${layer1.jurisdiction !== "Not stated" ? layer1.jurisdiction : "common law jurisdictions"} that are ABSENT. Cross-reference the Required Clauses Checklist above.
For each missing clause: name it, explain in one sentence why its absence matters for ${primaryParty}, and rate the gap as critical, important, or minor. If nothing material is missing, write: "This contract includes all standard protective clauses expected for a ${layer1.contractType} agreement."

<!-- SECTION:CONFIDENCE -->
A number from 0 to 100, followed by a period and one sentence. Base the score on: completeness of the document, clarity of language, presence of standard clauses, and ability to provide thorough analysis. Do NOT mention truncation, character counts, or technical processing details. Example: "82. This contract is well-structured with clear terms, enabling a thorough and reliable analysis."

Output all four sections in order. Do not skip any section. Do not add commentary outside the sections. Do not reproduce OBLIGATIONS, POWERS, or TIMELINE — those are handled separately.`;
}

/**
 * Builds the user prompt for synthesis, injecting extracted agent outputs as context.
 * Passes the FULL contract text — no truncation.
 */
export function buildLayer2UserPrompt(
  contractText: string,
  mode: AnalysisMode,
  extractedObligations: string,
  extractedTimeline: string,
  extractedPowers: string
): string {
  return `Please synthesise this contract analysis. Produce the four required sections: SUMMARY, REDFLAGS, MISSING, CONFIDENCE.

The following sections were already extracted by specialist agents — use them as your verified source of truth when assessing obligations, timeline, and powers:

=== OBLIGATIONS (extracted by Agent A) ===
${extractedObligations || "(No obligations extracted — review the full contract below)"}

=== TIMELINE (extracted by Agent B) ===
${extractedTimeline || "[]"}

=== POWERS & CONTROLS (extracted by Agent C) ===
${extractedPowers || "(No powers extracted — review the full contract below)"}

Analyse from the ${mode === "SIGNER" ? "SIGNER's perspective" : "SENDER's perspective"} as instructed in your system prompt.

FULL CONTRACT TEXT:
${contractText}`;
}
