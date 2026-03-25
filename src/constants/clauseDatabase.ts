/**
 * Static registry of standard required clauses per contract type.
 * Used by the synthesis agent to ground MISSING section findings deterministically —
 * preventing hallucinated "missing" clauses and ensuring industry-standard coverage.
 */
export const REQUIRED_CLAUSES: Record<string, string[]> = {
  employment: [
    "Compensation & benefits schedule",
    "At-will termination / notice period",
    "IP assignment & work-for-hire clause",
    "Non-compete scope and duration",
    "Non-solicitation clause",
    "Confidentiality / NDA provisions",
    "Dispute resolution mechanism",
    "Governing law and jurisdiction",
    "Severability clause",
  ],
  NDA: [
    "Survival clause (obligations survive termination)",
    "Return or destruction of materials on expiry",
    "Definition of Confidential Information (inclusions & exclusions)",
    "Term and expiry date",
    "Permitted disclosures (legal requirement carve-out)",
    "Remedies for breach (injunctive relief)",
    "Mutual vs. one-way obligations clearly stated",
    "Governing law",
  ],
  freelance: [
    "Scope of work / deliverables definition",
    "IP assignment & work-for-hire clause",
    "Payment schedule and late payment penalties",
    "Revision and acceptance procedure",
    "Kill fee / early termination compensation",
    "Limitation of liability cap",
    "Confidentiality clause",
    "Independent contractor status (no employee relationship)",
    "Governing law",
  ],
  service: [
    "Service level agreement (SLA) or performance standards",
    "Payment terms and invoicing procedure",
    "Limitation of liability cap",
    "Indemnification (mutual or one-sided)",
    "Intellectual property ownership of outputs",
    "Confidentiality provisions",
    "Term and termination for convenience",
    "Force majeure clause",
    "Governing law and dispute resolution",
    "Entire agreement / integration clause",
  ],
  SaaS: [
    "Uptime SLA and service credits",
    "Data ownership and portability on termination",
    "Data Processing Agreement / GDPR addendum",
    "Acceptable use policy",
    "Limitation of liability cap",
    "Subscription term and auto-renewal with cancellation notice",
    "IP ownership of platform vs. customer data",
    "Security obligations and breach notification",
    "Governing law and dispute resolution",
  ],
  lease: [
    "Security deposit terms and return conditions",
    "Permitted use of premises",
    "Maintenance and repair responsibilities",
    "Subletting and assignment restrictions",
    "Rent escalation / review mechanism",
    "Early termination / break clause",
    "Notice period for vacating",
    "Landlord right of entry provisions",
    "Governing law",
  ],
  partnership: [
    "Capital contributions and ownership percentages",
    "Profit and loss allocation",
    "Management and voting rights",
    "Partner withdrawal / exit mechanism",
    "Non-compete and non-solicitation",
    "IP ownership assigned to partnership",
    "Deadlock resolution mechanism",
    "Dissolution and winding-up procedure",
    "Governing law",
  ],
  "Shareholder Agreement": [
    "Share classes and voting rights",
    "Pre-emption rights on new share issuance",
    "Drag-along and tag-along rights",
    "Right of first refusal on share transfers",
    "Board composition and appointment rights",
    "Dividend policy",
    "Non-compete and non-solicitation on founders",
    "Anti-dilution provisions",
    "Governing law",
  ],
  loan: [
    "Principal amount and disbursement schedule",
    "Interest rate (fixed or variable) and calculation method",
    "Repayment schedule and early repayment rights",
    "Default events and cure periods",
    "Security / collateral provisions",
    "Representations and warranties of borrower",
    "Financial covenants",
    "Governing law",
  ],
  "IP License": [
    "Scope of license (exclusive/non-exclusive, field of use, territory)",
    "Royalty calculation and payment schedule",
    "Sublicensing rights",
    "Improvements and derivative works ownership",
    "Quality control and audit rights",
    "Term and termination triggers",
    "Representations of IP ownership / no infringement",
    "Governing law",
  ],
  construction: [
    "Scope of work / specifications",
    "Project timeline with milestones",
    "Payment schedule and retention",
    "Change order procedure",
    "Liquidated damages for delay",
    "Defect liability period / warranty",
    "Insurance requirements",
    "Dispute resolution (adjudication/arbitration)",
    "Force majeure clause",
    "Governing law",
  ],
  agency: [
    "Scope of authority (express vs. implied)",
    "Territory and exclusivity",
    "Commission rate and payment trigger",
    "Minimum performance targets",
    "Sub-agent restrictions",
    "Termination and post-termination compensation",
    "IP and confidentiality obligations",
    "Governing law",
  ],
  consulting: [
    "Statement of work / deliverables",
    "IP assignment of work product",
    "Conflict of interest disclosure",
    "Rate card and expense reimbursement",
    "Limitation of liability cap",
    "Confidentiality clause",
    "Non-solicitation of clients",
    "Independent contractor status",
    "Governing law",
  ],
  distribution: [
    "Territory and exclusivity",
    "Minimum purchase or performance commitments",
    "Pricing and discount structure",
    "IP license for branding/trademarks",
    "Quality standards and compliance",
    "Termination for underperformance",
    "Inventory and returns policy",
    "Governing law",
  ],
  "Real Estate Purchase": [
    "Purchase price and deposit schedule",
    "Due diligence period and conditions",
    "Title and property representations",
    "Survey and inspection rights",
    "Risk of loss provisions",
    "Financing contingency",
    "Closing date and conditions precedent",
    "Remedies on breach (specific performance / liquidated damages)",
    "Governing law",
  ],
  other: [
    "Limitation of liability cap",
    "Indemnification clause",
    "Force majeure clause",
    "Confidentiality provisions",
    "Dispute resolution mechanism",
    "Governing law and jurisdiction",
    "Severability clause",
    "Entire agreement / integration clause",
    "Notice provisions",
  ],
};

/**
 * Static jurisdiction-aware boilerplate for generated contracts.
 * Injected after the AI draft — not LLM-generated — to ensure legal reliability.
 */
export const BOILERPLATE: Record<string, string> = {
  California: `
**Force Majeure.** Neither party shall be liable for any delay or failure to perform its obligations under this Agreement to the extent caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, governmental action, strikes, or failures of third-party infrastructure, provided the affected party gives prompt written notice and uses commercially reasonable efforts to resume performance.

**Entire Agreement.** This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, warranties, and agreements, whether written or oral.

**Governing Law.** This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the state and federal courts located in California.

**Dispute Resolution.** The parties agree to attempt to resolve any dispute through good-faith negotiation for a period of thirty (30) days before initiating formal proceedings. If unresolved, disputes shall be submitted to binding arbitration under the rules of JAMS in California.
`,
  "New York": `
**Force Majeure.** Neither party shall be liable for any delay or failure to perform its obligations under this Agreement to the extent caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, governmental action, strikes, or failures of third-party infrastructure, provided the affected party gives prompt written notice and uses commercially reasonable efforts to resume performance.

**Entire Agreement.** This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, warranties, and agreements, whether written or oral.

**Governing Law.** This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the state and federal courts located in New York County, New York.

**Dispute Resolution.** The parties agree to attempt to resolve any dispute through good-faith negotiation for a period of thirty (30) days before initiating formal proceedings. If unresolved, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association (AAA) in New York.
`,
  "England and Wales": `
**Force Majeure.** Neither party shall be in breach of this Agreement nor liable for delay in performing, or failure to perform, any of its obligations under this Agreement if such delay or failure results from events, circumstances or causes beyond its reasonable control. In such circumstances the affected party shall be entitled to a reasonable extension of time for performing such obligations.

**Entire Agreement.** This Agreement constitutes the entire agreement between the parties and supersedes all previous agreements, understandings and arrangements between them, whether in writing or oral, in respect of its subject matter.

**Governing Law.** This Agreement and any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with it or its subject matter or formation shall be governed by and construed in accordance with the law of England and Wales.

**Dispute Resolution.** Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration under the LCIA Rules, which Rules are deemed to be incorporated by reference into this clause. The seat of arbitration shall be London. The language of the arbitration shall be English.
`,
  default: `
**Force Majeure.** Neither party shall be liable for any delay or failure to perform its obligations under this Agreement to the extent caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, governmental action, or failures of third-party infrastructure, provided the affected party gives prompt written notice and uses commercially reasonable efforts to resume performance.

**Entire Agreement.** This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, and agreements, whether written or oral.

**Governing Law.** This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction specified herein, and the parties submit to the exclusive jurisdiction of the courts of that jurisdiction.

**Dispute Resolution.** The parties agree to attempt to resolve any dispute through good-faith negotiation for thirty (30) days before initiating formal proceedings. Unresolved disputes shall be submitted to binding arbitration under internationally recognized arbitration rules.

**Severability.** If any provision of this Agreement is held to be invalid, illegal or unenforceable, the remaining provisions shall continue in full force and effect.

**Amendment.** No amendment or modification of this Agreement shall be effective unless made in writing and signed by authorized representatives of both parties.

**Notices.** All notices under this Agreement shall be in writing and delivered by email (with read receipt) or registered mail to the addresses specified by each party.
`,
};

/**
 * Retrieve the boilerplate text for a given jurisdiction string.
 * Performs a case-insensitive partial match against known jurisdictions.
 */
export function getBoilerplate(jurisdiction: string): string {
  const j = jurisdiction.toLowerCase();
  if (j.includes("california")) return BOILERPLATE["California"];
  if (j.includes("new york")) return BOILERPLATE["New York"];
  if (j.includes("england") || j.includes("wales") || j.includes("uk") || j.includes("united kingdom")) return BOILERPLATE["England and Wales"];
  return BOILERPLATE["default"];
}

/**
 * Get required clauses for a contract type, falling back to "other".
 */
export function getRequiredClauses(contractType: string): string[] {
  return REQUIRED_CLAUSES[contractType] ?? REQUIRED_CLAUSES["other"];
}
