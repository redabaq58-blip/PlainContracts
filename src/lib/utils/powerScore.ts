import type { RedFlag } from "@/types";

const SEVERITY_WEIGHTS: Record<string, number> = {
  High: 20,
  Medium: 10,
  Low: 5,
};

/**
 * Calculates a contract fairness score (0-100).
 * 100 = perfectly balanced. 0 = completely one-sided against you.
 * Deducts points for each red flag weighted by severity.
 */
export function calculatePowerScore(
  redFlags: RedFlag[],
  missingClausesText: string
): number {
  let score = 100;

  for (const flag of redFlags) {
    score -= SEVERITY_WEIGHTS[flag.severity] ?? 5;
  }

  // Deduct for missing clauses (rough heuristic: count bullet points)
  const missingCount = (missingClausesText.match(/^[-•*]/gm) ?? []).length;
  score -= missingCount * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getPowerScoreLabel(score: number): string {
  if (score >= 75) return "Well-balanced contract";
  if (score >= 55) return "Moderately balanced — some concerns";
  if (score >= 35) return "One-sided — review carefully before signing";
  return "Heavily one-sided — significant risk";
}

export function getPowerScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}
