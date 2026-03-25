import { getAnthropicClient } from "./client";
import type { Layer1Result } from "@/types";

const FALLBACK: Layer1Result = {
  contractType: "other",
  jurisdiction: "Not stated",
  signerRole: "Party",
  counterpartyRole: "Other Party",
  isComplete: true,
  completenessNote: "",
  confidence: 50,
  voidRisk: false,
  missingElements: [],
};

/**
 * Layer 1 — Contract Intelligence
 * Uses Claude Haiku to detect contract metadata: type, jurisdiction, party roles,
 * completeness, void risk, and missing essential elements.
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
      max_tokens: 768,
      system: `You are a contract classification and triage expert. Analyse the provided contract and return ONLY a JSON object with no surrounding text or markdown.

Required JSON shape:
{
  "contractType": "one of: employment | lease | NDA | freelance | service | SaaS | partnership | loan | IP License | Shareholder Agreement | construction | agency | consulting | distribution | Real Estate Purchase | other",
  "jurisdiction": "state/country if stated, or 'Not stated'",
  "signerRole": "role of the person expected to sign (e.g. Employee, Tenant, Contractor, Licensee, Buyer)",
  "counterpartyRole": "role of the other party (e.g. Employer, Landlord, Client, Licensor, Seller)",
  "isComplete": true or false (false if this appears to be an excerpt, draft, or template with blanks),
  "completenessNote": "short note if incomplete, empty string otherwise",
  "confidence": number 0-100 (how confident you are in your classification),
  "voidRisk": true or false (true if essential contract elements are absent — e.g. parties not identified, no consideration stated, or document is clearly a blank template),
  "missingElements": ["array of strings describing absent essential elements, e.g. 'No parties identified', 'No consideration or price stated', 'No effective date' — empty array if none missing"]
}

Contract type definitions:
- employment: full-time or part-time employment agreements
- lease: residential or commercial property leases and rental agreements
- NDA: non-disclosure and confidentiality agreements
- freelance: independent contractor / gig work agreements
- service: professional services, maintenance, or outsourcing agreements
- SaaS: software-as-a-service subscription agreements
- partnership: business partnership or joint venture agreements
- loan: loan, credit, or debt agreements
- IP License: intellectual property licensing agreements
- Shareholder Agreement: shareholder or stockholder agreements
- construction: construction, renovation, or building contracts
- agency: agency, representation, or distribution-agency agreements
- consulting: consulting, advisory, or management agreements
- distribution: product distribution or reseller agreements
- Real Estate Purchase: property purchase and sale agreements
- other: anything not covered above`,
      messages: [
        {
          role: "user",
          content: `Classify this contract:\n\n${contractText.slice(0, 8000)}`,
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
      return {
        contractType: parsed.contractType,
        jurisdiction: parsed.jurisdiction,
        signerRole: parsed.signerRole,
        counterpartyRole: parsed.counterpartyRole,
        isComplete: parsed.isComplete,
        completenessNote: parsed.completenessNote ?? "",
        confidence: parsed.confidence,
        voidRisk: typeof parsed.voidRisk === "boolean" ? parsed.voidRisk : false,
        missingElements: Array.isArray(parsed.missingElements) ? parsed.missingElements : [],
      };
    }

    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
