"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AnalysisStatus, Layer1Result } from "@/types";

interface AnalysisPipelineProps {
  status: AnalysisStatus;
  layer1Result: Layer1Result | null;
}

export function AnalysisPipeline({ status, layer1Result }: AnalysisPipelineProps) {
  // Determine per-step state based on current status
  const getStepState = (stepStatus: AnalysisStatus[]): "pending" | "active" | "done" => {
    const ORDER: AnalysisStatus[] = ["layer1", "extracting", "streaming", "verifying"];
    const currentIdx = ORDER.indexOf(status);

    if (status === "done" || status === "error") return "done";

    const stepIdxes = stepStatus.map((s) => ORDER.indexOf(s)).filter((i) => i !== -1);
    const firstIdx = Math.min(...stepIdxes);
    const lastIdx = Math.max(...stepIdxes);

    if (currentIdx === -1) return "pending";
    if (currentIdx > lastIdx) return "done";
    if (currentIdx >= firstIdx && currentIdx <= lastIdx) return "active";
    return "pending";
  };

  const steps = [
    {
      label: "Contract Intelligence",
      state: getStepState(["layer1"]),
      sublabel: layer1Result
        ? `${layer1Result.contractType} · ${layer1Result.jurisdiction}${layer1Result.voidRisk ? " · ⚠ Void Risk" : ""}`
        : "Detecting contract type, jurisdiction, and parties",
    },
    {
      label: "Parallel Extraction",
      state: getStepState(["extracting"]),
      sublabel:
        status === "extracting"
          ? "Agent A: Obligations · Agent B: Timeline · Agent C: Powers"
          : status === "idle" || status === "layer1"
          ? "3 specialist agents run in parallel"
          : "Obligations · Timeline · Powers — extracted",
    },
    {
      label: "Legal Synthesis",
      state: getStepState(["streaming"]),
      sublabel: "Summary · Red Flags · Missing Clauses · Confidence",
    },
    {
      label: "Senior Partner Stress Test",
      state: getStepState(["verifying"]),
      sublabel: "5 structural legal tests — inter-play, sole remedy, successor risk…",
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card mb-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {step.state === "done" ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : step.state === "active" ? (
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-border" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                step.state === "pending" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {i + 1}. {step.label}
            </p>
            {step.state !== "pending" && step.sublabel && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {step.sublabel}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
