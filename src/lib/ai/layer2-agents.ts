import { getAnthropicClient } from "./client";
import type { Layer1Result, AnalysisMode } from "@/types";

/**
 * Layer 2 Parallel Extraction Agents
 *
 * Three specialized Haiku agents that run concurrently, each focused on a single
 * extraction task. Full contract text is passed to each agent — no truncation.
 *
 * Agent A — Performance Auditor   → OBLIGATIONS section
 * Agent B — Timeline Extractor    → TIMELINE section
 * Agent C — Powers & Control      → POWERS section
 */

// ─── Agent A: Performance Auditor ────────────────────────────────────────────

function buildAgentASystemPrompt(
  signerRole: string,
  counterpartyRole: string,
  mode: AnalysisMode
): string {
  const primary = mode === "SIGNER" ? signerRole : counterpartyRole;
  const other = mode === "SIGNER" ? counterpartyRole : signerRole;

  return `You are a contract obligations extractor. Your ONLY task is to identify and list every obligation that ${primary} must perform under this contract.

Rules:
- Extract ONLY performance obligations, duties, and delivery requirements
- Include every obligation, no matter how minor
- Start each bullet with a strong action verb (e.g., "Pay", "Deliver", "Maintain", "Provide")
- Include the clause or section reference in parentheses where identifiable (e.g., "(Section 3.2)")
- Include specific quantities, timeframes, and conditions where stated
- Do NOT include the other party's (${other}'s) obligations
- Do NOT include rights, powers, or permissions — only duties

After all of ${primary}'s obligations, add a blank line then: "**In return, ${other} must:**" followed by 3–6 bullets listing ${other}'s core obligations to ${primary}. This reveals whether the exchange is balanced.

Format as plain markdown bullet points. No headings. No commentary outside the bullet lists.`;
}

async function runAgentA(
  contractText: string,
  layer1: Layer1Result,
  mode: AnalysisMode,
  privacyMode: boolean
): Promise<string> {
  const client = getAnthropicClient(privacyMode);
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: buildAgentASystemPrompt(layer1.signerRole, layer1.counterpartyRole, mode),
      messages: [
        {
          role: "user",
          content: `Extract all obligations from this contract. Be exhaustive — list every duty, payment, delivery, and performance obligation.\n\nCONTRACT:\n${contractText}`,
        },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch {
    return "";
  }
}

// ─── Agent B: Timeline Extractor ─────────────────────────────────────────────

const AGENT_B_SYSTEM = `You are a contract timeline extractor. Your ONLY task is to find every time-based obligation, deadline, and duration in this contract.

Output a JSON array. Each object must have exactly:
{
  "label": "Descriptive name (e.g. 'Notice period for termination', 'Non-compete duration post-employment', 'Payment due after invoice')",
  "value": "The exact duration or date as stated (e.g. '30 days', '12 months after termination', 'March 31, 2025')",
  "urgency": "high" | "medium" | "low"
}

Urgency guide:
- high = deadlines that trigger penalties, termination, or loss of rights if missed
- medium = important operational dates (payment cycles, renewal windows, performance milestones)
- low = informational timeframes (warranty periods, record retention)

Include: notice periods, probation/trial periods, payment terms, renewal and auto-renewal windows, non-compete durations, IP assignment periods, warranty periods, cure periods, statute of limitations, any deadline.

Sort from most urgent/earliest to least urgent.
If no time-based information is found, output: []
Output ONLY the JSON array. No commentary, no markdown fences.`;

async function runAgentB(
  contractText: string,
  privacyMode: boolean
): Promise<string> {
  const client = getAnthropicClient(privacyMode);
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: AGENT_B_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Extract all time-based obligations and deadlines from this contract. Sort by urgency (most critical first).\n\nCONTRACT:\n${contractText}`,
        },
      ],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "[]";
    // Validate it's parseable JSON; fallback to empty array if not
    try {
      JSON.parse(text);
      return text;
    } catch {
      return "[]";
    }
  } catch {
    return "[]";
  }
}

// ─── Agent C: Powers & Control Auditor ───────────────────────────────────────

function buildAgentCSystemPrompt(
  signerRole: string,
  counterpartyRole: string,
  mode: AnalysisMode
): string {
  const primary = mode === "SIGNER" ? signerRole : counterpartyRole;
  const other = mode === "SIGNER" ? counterpartyRole : signerRole;

  return `You are a contract powers and control auditor. Your ONLY task is to identify every unilateral right, enforcement mechanism, and control clause that ${other} holds over ${primary}.

Specifically look for:
- Termination rights (with and without cause, notice requirements)
- Rights to amend or modify the contract without ${primary}'s consent
- Penalty, liquidated damages, and clawback provisions
- IP and work product ownership claims
- Non-compete and non-solicitation enforcement
- Audit, inspection, and monitoring rights
- Unilateral pricing changes or fee adjustments
- Assignment and subcontracting rights (can they transfer this contract?)
- Set-off and withholding rights
- Suspension of services or access
- Data collection and usage rights

After listing ${other}'s powers, add a blank line then: "**${primary}'s protections:**" followed by bullets listing ${primary}'s own protective rights (termination rights, notice periods, cure periods, limitation of liability, indemnification, dispute rights). If protections are weak or absent, write: "**Limited protections found for ${primary}** — this contract lacks [specific missing protections]."

Format as plain markdown bullet points, organized by power category. No commentary outside the bullet lists.`;
}

async function runAgentC(
  contractText: string,
  layer1: Layer1Result,
  mode: AnalysisMode,
  privacyMode: boolean
): Promise<string> {
  const client = getAnthropicClient(privacyMode);
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: buildAgentCSystemPrompt(layer1.signerRole, layer1.counterpartyRole, mode),
      messages: [
        {
          role: "user",
          content: `Extract all unilateral powers, rights, and control mechanisms from this contract. Be exhaustive.\n\nCONTRACT:\n${contractText}`,
        },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch {
    return "";
  }
}

// ─── Parallel runner ─────────────────────────────────────────────────────────

export interface Layer2AgentResults {
  obligations: string;
  timeline: string;
  powers: string;
}

/**
 * Runs all three extraction agents in parallel.
 * Uses Promise.allSettled so a single agent failure never kills the pipeline.
 * Each agent receives the FULL contract text — no truncation.
 */
export async function runLayer2Agents(
  contractText: string,
  layer1: Layer1Result,
  mode: AnalysisMode,
  privacyMode: boolean
): Promise<Layer2AgentResults> {
  const [obligationsResult, timelineResult, powersResult] =
    await Promise.allSettled([
      runAgentA(contractText, layer1, mode, privacyMode),
      runAgentB(contractText, privacyMode),
      runAgentC(contractText, layer1, mode, privacyMode),
    ]);

  return {
    obligations:
      obligationsResult.status === "fulfilled" ? obligationsResult.value : "",
    timeline:
      timelineResult.status === "fulfilled" ? timelineResult.value : "[]",
    powers:
      powersResult.status === "fulfilled" ? powersResult.value : "",
  };
}
