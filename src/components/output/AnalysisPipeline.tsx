"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AnalysisStatus, Layer1Result } from "@/types";

interface Step {
  id: string;
  label: string;
  sublabel?: string;
}

interface AnalysisPipelineProps {
  status: AnalysisStatus;
  layer1Result: Layer1Result | null;
}

export function AnalysisPipeline({ status, layer1Result }: AnalysisPipelineProps) {
  const steps: Step[] = [
    {
      id: "layer1",
      label: "Contract Intelligence",
      sublabel: layer1Result
        ? `${layer1Result.contractType} · ${layer1Result.jurisdiction} · ${layer1Result.signerRole} vs ${layer1Result.counterpartyRole}`
        : "Detecting contract type, jurisdiction, and parties",
    },
    {
      id: "streaming",
      label: "Plain Language Translation",
      sublabel: "Generating 7 output sections",
    },
    {
      id: "verifying",
      label: "Adversarial Verification",
      sublabel: "Checking red flags against source text",
    },
  ];

  const getStepState = (stepId: string): "pending" | "active" | "done" => {
    const order = ["layer1", "streaming", "verifying"];
    const currentIdx = order.indexOf(status === "done" ? "done" : status);
    const stepIdx = order.indexOf(stepId);

    if (status === "done") return "done";
    if (currentIdx === -1) return "pending";
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card mb-4">
      {steps.map((step, i) => {
        const state = getStepState(step.id);
        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {state === "done" ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : state === "active" ? (
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
                  state === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {i + 1}. {step.label}
              </p>
              {state !== "pending" && step.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {step.sublabel}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
