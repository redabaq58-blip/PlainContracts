import { getAnthropicClient } from "./client";
import type { AnalysisMode, StressTestResult } from "@/types";

/**
 * Layer 3 — Senior Partner Stress Test Engine
 *
 * Uses Claude Sonnet to run 5 structural legal stress tests that go far beyond
 * checking whether red flags are grounded. This is the adversarial legal reasoning
 * layer that catches hidden liabilities a simple LLM summary will miss.
 *
 * SIGNER mode applies Contra Proferentem — hunting unilateral powers, uncapped
 * indemnities, and one-sided termination.
 * SENDER mode applies a hostile counsel lens — hunting weak IP, undefined
 * performance standards, and inadequate protections for the drafting party.
 */

const STRESS_TESTS_SIGNER = `You are a senior litigation partner applying adversarial legal stress tests to a contract. You represent the NON-DRAFTING party (the signer). Apply Contra Proferentem — any ambiguity is interpreted against the drafter.

Run exactly these 5 structural stress tests and return ONLY a JSON array:

1. **interplay** — Liability Cap vs. Indemnification Inter-play Test
   Does the contract contain both a liability cap AND an indemnification obligation? If so: does the cap effectively nullify or contradict the indemnity? (e.g., the cap is set at $0 or a nominal amount, making the indemnity worthless, or conversely, the indemnity is uncapped while the cap protects the other party). This is the most dangerous hidden trap in commercial contracts.

2. **soleRemedy** — Sole Remedy / Exclusive Remedy Trap
   Does any clause state that a specific remedy (e.g., refund, repair, replacement) is the "sole", "exclusive", or "only" remedy — thereby waiving the signer's right to sue for consequential damages, lost profits, or other legal remedies? This silently strips the signer of most legal recourse.

3. **successorRisk** — Change of Control / Successor Risk
   Can the contract be assigned to a third party — including a competitor or acquirer — without the signer's consent? Does a change of control at the other party automatically bind the signer to the new entity? This exposes the signer to working with an entirely different company than they contracted with.

4. **contraProferentem** — Uncapped Indemnification Exposure
   Does the contract impose an indemnification obligation on the signer with NO dollar cap? Does it cover third-party claims broadly (e.g., "any claims arising from" rather than "claims arising from signer's gross negligence")? An uncapped, broadly-worded indemnity can bankrupt an individual or small business.

5. **uncappedIndemnity** — Absence of Termination for Convenience
   Does the signer have NO right to exit the contract without cause (no "termination for convenience" right)? Are they locked in for the full term with no exit, or only able to exit by paying substantial penalties? This traps the signer regardless of changed circumstances.

For each test, return:
{
  "test": "interplay" | "soleRemedy" | "successorRisk" | "contraProferentem" | "uncappedIndemnity",
  "triggered": true if the risk was found, false if the contract handles this adequately,
  "finding": "One specific sentence describing exactly what was found (or 'Not present — contract adequately addresses this risk')",
  "severity": "High" | "Medium" | "Low" (only meaningful when triggered: true)
}

Return ONLY the JSON array of exactly 5 objects, one per test, in the order listed above. No commentary, no markdown fences.`;

const STRESS_TESTS_SENDER = `You are a senior transactional partner applying adversarial stress tests to a contract. You represent the DRAFTING party (the sender/business). Hunt for provisions that leave the business exposed or inadequately protected.

Run exactly these 5 structural stress tests and return ONLY a JSON array:

1. **interplay** — IP Ownership Verification Test
   Does the contract clearly and unambiguously assign ALL intellectual property, work product, and deliverables to the business? Are there carve-outs, retained rights, or ambiguous language that could allow the counterparty to claim ownership over IP developed during the engagement? Weak IP clauses are existential risks for product companies.

2. **soleRemedy** — Performance Standards Gap Test
   Does the contract use vague, unenforceable language for performance obligations (e.g., "best efforts", "reasonable endeavours", "as soon as practicable")? Are there measurable, objective metrics for what constitutes acceptable performance? Without defined standards, the business cannot enforce delivery or terminate for underperformance.

3. **successorRisk** — Liability Cap Adequacy Test
   Does the contract cap the business's liability at an amount that is commercially reasonable? Or is the business exposed to unlimited damages, consequential losses, or claims exceeding the contract value? No cap or an inadequate cap creates existential financial exposure.

4. **contraProferentem** — Data Privacy & Regulatory Exposure Test
   Does the contract impose any data protection, GDPR/CCPA, or privacy compliance obligations on the business without appropriate protections? Does it handle personal data without a Data Processing Agreement? Does it impose data breach notification obligations without cure periods? Regulatory non-compliance can result in significant fines.

5. **uncappedIndemnity** — Audit Rights & Enforcement Gap Test
   Does the business retain adequate audit rights, inspection rights, and enforcement mechanisms? Can they verify the counterparty's compliance with contractual obligations? Without audit rights, the business cannot enforce the contract or detect breaches early.

For each test, return:
{
  "test": "interplay" | "soleRemedy" | "successorRisk" | "contraProferentem" | "uncappedIndemnity",
  "triggered": true if the risk/gap was found, false if the contract handles this adequately,
  "finding": "One specific sentence describing exactly what was found (or 'Not present — contract adequately addresses this risk')",
  "severity": "High" | "Medium" | "Low" (only meaningful when triggered: true)
}

Return ONLY the JSON array of exactly 5 objects, in the order listed above. No commentary, no markdown fences.`;

const FALLBACK_STRESS_TESTS: StressTestResult[] = [];

/**
 * Runs 5 structural stress tests using Claude Sonnet.
 * Mode-aware: different test framing for SIGNER vs SENDER perspective.
 */
export async function runStressTests(
  contractText: string,
  synthesisOutput: string,
  mode: AnalysisMode,
  privacyMode: boolean
): Promise<StressTestResult[]> {
  const client = getAnthropicClient(privacyMode);

  const systemPrompt =
    mode === "SIGNER" ? STRESS_TESTS_SIGNER : STRESS_TESTS_SENDER;

  // Provide both the raw contract and the synthesized analysis for maximum context
  const contractSample = contractText.slice(0, 40000);
  const synthesisSample = synthesisOutput.slice(0, 4000);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Run all 5 structural stress tests on this contract.

CONTRACT TEXT:
${contractSample}

PRIOR ANALYSIS SUMMARY (from extraction agents):
${synthesisSample}

Return the JSON array of 5 stress test results now.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return FALLBACK_STRESS_TESTS;

    // Validate shape of each result
    const valid = parsed.filter(
      (r) =>
        typeof r.test === "string" &&
        typeof r.triggered === "boolean" &&
        typeof r.finding === "string" &&
        typeof r.severity === "string"
    ) as StressTestResult[];

    return valid;
  } catch {
    return FALLBACK_STRESS_TESTS;
  }
}
