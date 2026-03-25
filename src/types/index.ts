// ─── Audience & Mode ─────────────────────────────────────────────────────────

export type AudienceLevel = "SIMPLE" | "INFORMED" | "DETAILED";
export type AnalysisMode = "SIGNER" | "SENDER";
export type Severity = "High" | "Medium" | "Low";

// ─── Layer 1 ──────────────────────────────────────────────────────────────────

export interface Layer1Result {
  contractType: string;
  jurisdiction: string;
  signerRole: string;
  counterpartyRole: string;
  isComplete: boolean;
  completenessNote: string;
  confidence: number;
  voidRisk: boolean;
  missingElements: string[];
}

// ─── Layer 2 outputs ─────────────────────────────────────────────────────────

export interface RedFlag {
  clauseRef: string;
  severity: Severity;
  explanation: string;
  negotiationTip: string;
  negotiationEmail: string;
  clauseRewrite?: string; // only in DETAILED mode
}

export interface KeyDate {
  label: string;
  value: string;
  urgency: "high" | "medium" | "low";
}

// ─── Layer 3 ──────────────────────────────────────────────────────────────────

export interface Layer3Error {
  section: string;
  description: string;
  correction: string;
}

export interface StressTestResult {
  test: "interplay" | "soleRemedy" | "successorRisk" | "contraProferentem" | "uncappedIndemnity";
  triggered: boolean;
  finding: string;
  severity: Severity;
}

export interface Layer3Result {
  accurate: boolean;
  errors: Layer3Error[];
  confidenceAdjustment: number;
  stressTests: StressTestResult[];
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export type SectionKey =
  | "SUMMARY"
  | "OBLIGATIONS"
  | "POWERS"
  | "REDFLAGS"
  | "MISSING"
  | "CONFIDENCE"
  | "TIMELINE"
  | "DIAGRAM";

export type ParsedSections = Partial<Record<SectionKey, string>>;

// ─── Analysis state ───────────────────────────────────────────────────────────

export type AnalysisStatus =
  | "idle"
  | "layer1"
  | "extracting"
  | "streaming"
  | "verifying"
  | "done"
  | "error";

export interface AnalysisState {
  status: AnalysisStatus;
  rawText: string;
  sections: ParsedSections;
  layer1Result: Layer1Result | null;
  layer3Result: Layer3Result | null;
  powerScore: number | null;
  error: string | null;
}

// ─── API request/response ─────────────────────────────────────────────────────

export interface AnalyzeRequest {
  contractText: string;
  audienceLevel: AudienceLevel;
  mode: AnalysisMode;
  privacyMode?: boolean;
  layer1Cache?: Layer1Result;
}

export interface QAMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QARequest {
  contractText: string;
  analysisContext: string;
  messages: QAMessage[];
  question: string;
  privacyMode?: boolean;
}
