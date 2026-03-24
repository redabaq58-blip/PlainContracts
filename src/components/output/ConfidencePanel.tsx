"use client";

import { Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Layer1Result, Layer3Result } from "@/types";

interface ConfidencePanelProps {
  content?: string;
  layer1Result?: Layer1Result | null;
  layer3Result?: Layer3Result | null;
  streaming?: boolean;
}

function parseConfidenceText(text: string): {
  score: number;
  explanation: string;
} {
  const match = text.match(/^(\d+)\.\s*([\s\S]*)/);
  if (match) {
    const explanation = match[2].trim();
    return {
      score: Math.min(100, Math.max(0, parseInt(match[1], 10))),
      explanation: explanation || "Translation complete.",
    };
  }
  // Fallback: maybe the model returned just a number
  const numOnly = text.match(/^(\d+)$/);
  if (numOnly) {
    return {
      score: Math.min(100, Math.max(0, parseInt(numOnly[1], 10))),
      explanation: "Translation complete.",
    };
  }
  return { score: 0, explanation: text || "Confidence unavailable." };
}

export function ConfidencePanel({
  content,
  layer1Result,
  layer3Result,
  streaming,
}: ConfidencePanelProps) {
  if (!content && streaming) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Calculating confidence...
      </div>
    );
  }

  if (!content) return null;

  const { score, explanation } = parseConfidenceText(content);

  const colorClass =
    score >= 70
      ? "text-green-600 dark:text-green-400"
      : score >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const bgClass =
    score >= 70
      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
      : score >= 40
      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className={cn("rounded-lg border p-4 flex items-center gap-4", bgClass)}>
        <div className="text-center shrink-0">
          <div className={cn("text-4xl font-bold", colorClass)}>{score}</div>
          <div className="text-xs text-muted-foreground">/100</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Translation confidence
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </div>
      </div>

      {/* Layer 3 adjustment note */}
      {layer3Result && layer3Result.confidenceAdjustment !== 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Verification adjustment:{" "}
              <span
                className={
                  layer3Result.confidenceAdjustment > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {layer3Result.confidenceAdjustment > 0 ? "+" : ""}
                {layer3Result.confidenceAdjustment}
              </span>
            </span>
          </div>
          {layer3Result.errors.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {layer3Result.errors.map((err, i) => (
                <li key={i}>
                  <span className="font-medium">{err.section}:</span>{" "}
                  {err.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Contract metadata from Layer 1 */}
      {layer1Result && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Contract Details (Layer 1 Detection)
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Type</span>
              <p className="font-medium capitalize">{layer1Result.contractType}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Jurisdiction</span>
              <p className="font-medium">{layer1Result.jurisdiction}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">You are</span>
              <p className="font-medium">{layer1Result.signerRole}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Other party</span>
              <p className="font-medium">{layer1Result.counterpartyRole}</p>
            </div>
            {!layer1Result.isComplete && (
              <div className="col-span-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Excerpt only: {layer1Result.completenessNote}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
