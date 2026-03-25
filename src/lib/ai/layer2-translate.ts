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

  const languageInstruction = language !== "English"
    ? `IMPORTANT: Respond entirely in ${language}. All prose, bullet points, explanations, labels, negotiation emails, and sentences must be written in ${language}. Only JSON field names (clauseRef, severity, explanation, etc.) and section delimiter comments (<!-- SECTION:... -->) must remain in English.\n\n`
    : "";

  return `${languageInstruction}You are an expert contract analyst with deep legal knowledge across jurisdictions. You analyse contracts with the thoroughness and precision of a senior attorney, but translate your findings into language anyone can understand. You are NOT providing legal advice — you are providing an expert analysis of what is already written.

Your analysis must be:
- **Precise**: Reference specific clauses, sections, and language from the contract
- **Actionable**: Every finding should tell the reader exactly what it means for them in practice
- **Thorough**: Check for standard protections, unusual terms, missing safeguards, and jurisdiction-specific concerns
- **Balanced**: Acknowledge both favorable and unfavorable terms — don't assume everything is a red flag

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

OUTPUT FORMAT — You MUST output exactly seven sections using these exact delimiters in this exact order. Do not add any text before the first delimiter.

<!-- SECTION:SUMMARY -->
Four sentences, written with the authority of a legal review memo:
(1) What this contract is and its legal nature (e.g., "This is a fixed-term employment agreement" not just "This is an employment contract").
(2) Who the parties are and what the core exchange is — what each side gives and gets.
(3) Duration, termination conditions, and renewal terms.
(4) "**Bottom line:**" — one direct, authoritative verdict. Be specific: "This contract is heavily weighted toward ${otherParty} due to the unlimited liability clause, broad non-compete, and absence of a limitation of liability cap. ${primaryParty} should negotiate Sections X, Y, and Z before signing." or "This is a standard ${layer1.contractType} contract with market-typical terms. The main concern is [specific issue]."

<!-- SECTION:OBLIGATIONS -->
Bullet list of ${primaryParty}'s obligations. Each bullet = one specific duty. Start each with a strong action verb and include the clause reference where possible. Group related obligations logically. Be specific about amounts, timeframes, and conditions — not just "make payments" but "make monthly payments of the agreed amount within 30 days of invoice."

After listing all obligations, add: "**In return, ${otherParty} must:**" followed by 3-5 bullets summarising what ${otherParty} is obligated to provide. This reveals whether the exchange is balanced — a key thing lawyers look for.

<!-- SECTION:POWERS -->
Bullet list of what ${otherParty} CAN do under this contract — their rights and enforcement mechanisms. An experienced lawyer would specifically check:
- Termination rights (with and without cause, notice requirements)
- Penalty and liquidated damages clauses
- IP and work product ownership claims
- Non-compete and non-solicitation enforcement scope
- Audit, inspection, and monitoring rights
- Unilateral amendment or modification rights
- Assignment and subcontracting rights
- Clawback, set-off, or withholding provisions
- Dispute resolution and forum selection (who chooses where disputes are heard)

After listing their powers, add: "**Your protections:**" followed by 3-5 bullets listing ${primaryParty}'s protective rights — termination rights, notice periods, cure/remedy periods, limitation of liability, indemnification protections, dispute resolution rights, data protection rights. If protections are weak or absent, write: "**Limited protections found for ${primaryParty}** — this contract lacks [specific missing protections], which is unusual for a ${layer1.contractType} agreement and a significant negotiation point."

<!-- SECTION:REDFLAGS -->
${redflagsFormat}
Apply the severity guide strictly. A good attorney would catch 5-8 issues in a typical contract. Don't over-flag standard terms as red flags, but don't miss genuine risks either. Focus on:
1. Clauses that deviate from market standard for this contract type
2. Missing protections that should be present
3. Ambiguous language that could be interpreted against ${primaryParty}
4. Unconscionable or potentially unenforceable terms
5. Hidden obligations or automatic triggers
If genuinely no red flags: output []

<!-- SECTION:MISSING -->
Bullet list of standard clauses for a ${layer1.contractType} contract in ${layer1.jurisdiction !== "Not stated" ? layer1.jurisdiction : "common law jurisdictions"} that are ABSENT. An experienced attorney would check for:
- Limitation of liability / liability cap
- Indemnification (mutual or one-sided)
- Force majeure / excusable delays
- Dispute resolution mechanism (mediation, arbitration, litigation)
- Governing law and jurisdiction
- Confidentiality / NDA provisions
- Data protection and privacy
- Insurance requirements
- Assignment restrictions
- Intellectual property ownership
- Warranty and representations
- Severability clause
- Entire agreement / integration clause
- Notice provisions
For each missing clause: name it, explain in one sentence why its absence matters for ${primaryParty}, and rate the gap as critical, important, or minor. If nothing material is missing, write: "This contract includes all standard protective clauses expected for a ${layer1.contractType} agreement."

<!-- SECTION:CONFIDENCE -->
A number from 0 to 100, followed by a period and one sentence. Base the score on: completeness of the document, clarity of language, presence of standard clauses, and ability to provide thorough analysis. Do NOT mention truncation, character counts, or technical processing details. Example: "82. This contract is well-structured with clear terms, enabling a thorough and reliable analysis." Another example: "45. Several key sections contain ambiguous language and the document appears incomplete — verify critical terms with a qualified attorney before signing."

<!-- SECTION:TIMELINE -->
JSON array of all time-based obligations, deadlines, and durations. Each object:
{
  "label": "Descriptive name (e.g. Notice period for termination, Non-compete duration post-employment, Payment due after invoice)",
  "value": "The exact duration or date as stated (e.g. '30 days', '12 months after termination', 'March 31, 2025')",
  "urgency": "high" | "medium" | "low"
}
Urgency guide: high = deadlines that trigger penalties, termination, or loss of rights; medium = important operational dates; low = informational timeframes.
Include: notice periods, probation/trial periods, payment terms, renewal and auto-renewal dates, non-compete durations, IP assignment periods, warranty periods, cure periods, statute of limitations, any deadlines.
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
      ? `\n\n[INTERNAL NOTE — do NOT mention this to the user: The contract was truncated for processing. Analyse what is provided and note any sections that appear incomplete in your CONFIDENCE score, but do NOT reference truncation, character counts, or processing limits in your output.]`
      : "";

  return `Please analyse this contract and provide your translation in the required format (seven sections: SUMMARY, OBLIGATIONS, POWERS, REDFLAGS, MISSING, CONFIDENCE, TIMELINE).

Analyse from the ${mode === "SIGNER" ? "SIGNER's perspective" : "SENDER's perspective"} as instructed in your system prompt.

CONTRACT TEXT:
${truncated}${truncationNote}`;
}
