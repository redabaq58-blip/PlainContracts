import type { AudienceLevel, AnalysisMode, Layer1Result } from "@/types";

const AUDIENCE_INSTRUCTIONS: Record<AudienceLevel, string> = {
  SIMPLE:
    "Use simple, everyday language. No legal jargon whatsoever. Short sentences. Imagine explaining to someone who has never read a contract before.",
  INFORMED:
    "Use clear, plain language with minimal legal jargon. Direct and specific. The reader has signed contracts before but is not a lawyer.",
  DETAILED:
    "Full clause-level breakdown. Include specific section references throughout. In the REDFLAGS section, add a 'clauseRewrite' field with a complete alternative clause written in plain, balanced language.",
};

export function buildLayer2SystemPrompt(
  audienceLevel: AudienceLevel,
  mode: AnalysisMode,
  layer1: Layer1Result
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
  "explanation": "One sentence in plain language explaining why this clause is concerning",
  "negotiationTip": "One sentence — what to ask the other party to change",
  "negotiationEmail": "A complete, professional email paragraph ready to copy-paste. Address it as 'I would like to request...' and reference the specific clause.",
  "clauseRewrite": "A complete alternative clause written in plain, balanced language that protects both parties fairly."
}`
      : `JSON array. Each object must have exactly these fields:
{
  "clauseRef": "Section or clause reference (e.g. Section 7.2, Clause 3, paragraph 4)",
  "severity": "High" | "Medium" | "Low",
  "explanation": "One sentence in plain language explaining why this clause is concerning",
  "negotiationTip": "One sentence — what to ask the other party to change",
  "negotiationEmail": "A complete, professional email paragraph ready to copy-paste. Address it as 'I would like to request...' and reference the specific clause."
}`;

  return `You are a plain-language contract translator. You translate contracts into clear, accurate plain language. You are NOT providing legal advice. You are translating what is already written in the contract.

${perspective}

Contract details:
- Type: ${layer1.contractType}
- Jurisdiction: ${layer1.jurisdiction}
- Primary party (${isSignerMode ? "you" : "your client"}): ${primaryParty}
- Other party: ${otherParty}
- Complete document: ${layer1.isComplete ? "Yes" : "No — this appears to be an excerpt or draft"}${layer1.completenessNote ? `\n- Note: ${layer1.completenessNote}` : ""}

Audience: ${AUDIENCE_INSTRUCTIONS[audienceLevel]}

SEVERITY GUIDE for Red Flags:
- High: Significant risk of financial loss, job loss, legal liability, or loss of rights
- Medium: One-sided but manageable with awareness
- Low: Unusual but minor

OUTPUT FORMAT — You MUST output exactly seven sections using these exact delimiters in this exact order. Do not add any text before the first delimiter.

<!-- SECTION:SUMMARY -->
Three plain sentences: (1) what this contract is, (2) who the parties are and what the core exchange is, (3) how long it lasts or when it ends.

<!-- SECTION:OBLIGATIONS -->
Bullet list. Each bullet = one specific thing ${primaryParty} must do, pay, deliver, or avoid. Start each bullet with an action verb. Be specific. Only obligations — not rights.

<!-- SECTION:POWERS -->
Bullet list. What ${otherParty} CAN do under this contract. Include: termination rights, penalty clauses, IP/work ownership claims, non-compete enforcement, audit rights, amendment rights, unilateral change rights, clawback provisions. These are the clauses people miss until it is too late.

<!-- SECTION:REDFLAGS -->
${redflagsFormat}
Severity: High = significant risk, Medium = one-sided but manageable, Low = unusual but minor.
If no red flags: output []

<!-- SECTION:MISSING -->
Bullet list of standard clauses for a ${layer1.contractType} contract that are ABSENT from this document. For each missing clause: name it and in one sentence explain why its absence matters. If nothing material is missing, write: "No significant clauses appear to be missing."

<!-- SECTION:CONFIDENCE -->
A number from 0 to 100, followed by a period and one sentence. Example: "78. This contract is clearly written and our translation is high confidence." Another example: "41. This contract contains several ambiguous terms — verify key clauses with a qualified attorney."

<!-- SECTION:TIMELINE -->
JSON array of all time-based information in the contract. Each object:
{
  "label": "Descriptive name (e.g. Notice period, Non-compete duration, Payment due date)",
  "value": "The exact duration or date as stated in the contract",
  "urgency": "high" | "medium" | "low"
}
Include: notice periods, probation periods, payment terms, renewal/auto-renewal dates, non-compete durations, IP ownership periods, warranty periods, any deadlines.
If no time-based information found: output []

Output all seven sections in order. Do not skip any section. Do not add commentary outside the sections.`;
}

export function buildLayer2UserPrompt(
  contractText: string,
  mode: AnalysisMode
): string {
  const truncated = contractText.slice(0, 8000);
  const truncationNote =
    contractText.length > 8000
      ? `\n\n[Note: Contract truncated to 8000 characters for analysis. Full length: ${contractText.length} characters.]`
      : "";

  return `Please analyse this contract and provide your translation in the required seven-section format.

Analyse from the ${mode === "SIGNER" ? "SIGNER's perspective" : "SENDER's perspective"} as instructed in your system prompt.

CONTRACT TEXT:
${truncated}${truncationNote}`;
}
