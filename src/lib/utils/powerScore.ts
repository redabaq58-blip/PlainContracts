import type { RedFlag, StressTestResult } from "@/types";

const SEVERITY_WEIGHTS: Record<string, number> = {
  High: 15,
  Medium: 7,
  Low: 3,
  // Handle lowercase variants from LLM output
  high: 15,
  medium: 7,
  low: 3,
};

// Stress test deductions (only applied when triggered: true)
const STRESS_TEST_DEDUCTIONS: Record<string, number> = {
  soleRemedy: 15,       // Sole remedy trap — strips right to sue
  interplay: 10,         // Liability cap / indemnity inter-play
  uncappedIndemnity: 10, // Uncapped indemnity or no termination for convenience
  successorRisk: 5,      // Assignment / change of control risk
  contraProferentem: 5,  // Contra proferentem / data privacy gap
};

// Maximum total deduction from red flags and missing clauses
const MAX_FLAG_DEDUCTION = 55;
const MAX_MISSING_DEDUCTION = 20;
const MAX_STRESS_DEDUCTION = 40;

/**
 * Calculates a contract fairness / balance score (0–100).
 * 100 = perfectly balanced. 0 = completely one-sided or unenforceable.
 *
 * Deduction sources (capped to prevent always hitting zero):
 * 1. Red flags weighted by severity
 * 2. Missing standard clauses (rough heuristic: bullet count)
 * 3. Structural stress tests that triggered (adversarial findings)
 *
 * Bonus: if ≥ 3 stress tests did NOT trigger and score > 60, add +5 for
 * demonstrably balanced risk allocation.
 */
export function calculatePowerScore(
  redFlags: RedFlag[],
  missingClausesText: string,
  stressTests: StressTestResult[] = []
): number {
  let score = 100;

  // ── Red flag deductions (capped) ─────────────────────────────────────────
  let flagDeduction = 0;
  for (const flag of redFlags) {
    flagDeduction += SEVERITY_WEIGHTS[flag.severity] ?? 3;
  }
  score -= Math.min(flagDeduction, MAX_FLAG_DEDUCTION);

  // ── Missing clause deductions (rough heuristic: count bullet points, capped)
  const missingCount = (missingClausesText.match(/^[-•*]/gm) ?? []).length;
  score -= Math.min(missingCount * 2, MAX_MISSING_DEDUCTION);

  // ── Stress test deductions (capped) ──────────────────────────────────────
  let stressDeduction = 0;
  let notTriggeredCount = 0;
  for (const test of stressTests) {
    if (test.triggered) {
      stressDeduction += STRESS_TEST_DEDUCTIONS[test.test] ?? 5;
    } else {
      notTriggeredCount++;
    }
  }
  score -= Math.min(stressDeduction, MAX_STRESS_DEDUCTION);

  // ── Balanced contract bonus ───────────────────────────────────────────────
  if (notTriggeredCount >= 3 && score > 60) {
    score += 5;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

export function getPowerScoreLabel(score: number): string {
  if (score >= 75) return "Well-balanced contract";
  if (score >= 55) return "Moderately balanced — some concerns";
  if (score >= 35) return "One-sided — review carefully";
  if (score >= 20) return "Heavily one-sided — negotiate before signing";
  return "Very one-sided — seek legal advice before signing";
}

export function getPowerScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}
