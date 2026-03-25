import type { AudienceLevel, AnalysisMode, SectionKey } from "@/types";

export const AUDIENCE_LEVELS: { value: AudienceLevel; label: string; description: string }[] = [
  {
    value: "SIMPLE",
    label: "Simple",
    description: "No jargon. First-time signers.",
  },
  {
    value: "INFORMED",
    label: "Informed",
    description: "Clear language. You've signed before.",
  },
  {
    value: "DETAILED",
    label: "Detailed",
    description: "Full clause breakdown + rewrites.",
  },
];

export const ANALYSIS_MODES: { value: AnalysisMode; label: string; description: string }[] = [
  {
    value: "SIGNER",
    label: "Signer Mode",
    description: "What does this mean FOR ME?",
  },
  {
    value: "SENDER",
    label: "Sender Mode",
    description: "What does this EXPOSE MY BUSINESS to?",
  },
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  SUMMARY: "Summary",
  OBLIGATIONS: "Your Obligations",
  POWERS: "Their Powers",
  REDFLAGS: "Red Flags",
  MISSING: "Missing Clauses",
  CONFIDENCE: "Confidence",
  TIMELINE: "Key Dates",
  DIAGRAM: "Diagram",
};

export const SECTION_ORDER: SectionKey[] = [
  "SUMMARY",
  "OBLIGATIONS",
  "POWERS",
  "REDFLAGS",
  "MISSING",
  "TIMELINE",
  "CONFIDENCE",
  "DIAGRAM",
];

export const MAX_CONTRACT_CHARS = 100_000;
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
