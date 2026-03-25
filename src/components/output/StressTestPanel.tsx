"use client";

import { CheckCircle2, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StressTestResult } from "@/types";

interface StressTestPanelProps {
  stressTests: StressTestResult[];
  streaming?: boolean;
}

const TEST_META: Record<
  StressTestResult["test"],
  { label: string; description: string }
> = {
  interplay: {
    label: "Liability Cap vs Indemnity",
    description: "Does the liability cap render indemnity clauses meaningless?",
  },
  soleRemedy: {
    label: "Sole Remedy Trap",
    description: "Does any clause restrict or waive the right to pursue damages?",
  },
  successorRisk: {
    label: "Successor & Assignment Risk",
    description: "Can the contract be assigned or transferred without your consent?",
  },
  contraProferentem: {
    label: "Drafting Ambiguity",
    description: "Ambiguous terms interpreted against the drafting party under contra proferentem.",
  },
  uncappedIndemnity: {
    label: "Uncapped Indemnity Exposure",
    description: "Any indemnification obligation with no financial ceiling.",
  },
};

const severityColor = {
  High: "text-red-600 dark:text-red-400",
  Medium: "text-amber-600 dark:text-amber-400",
  Low: "text-blue-600 dark:text-blue-400",
};

const severityBg = {
  High: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  Medium: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  Low: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
};

export function StressTestPanel({ stressTests, streaming }: StressTestPanelProps) {
  if (streaming) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        Running 5 structural legal tests…
      </div>
    );
  }

  if (stressTests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No stress test results available.
      </p>
    );
  }

  const triggeredCount = stressTests.filter((t) => t.triggered).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-2 text-sm">
        {triggeredCount === 0 ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              All 5 structural tests passed — no critical vulnerabilities found
            </span>
          </>
        ) : triggeredCount <= 2 ? (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {triggeredCount} of 5 tests triggered — review findings below
            </span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400 font-medium">
              {triggeredCount} of 5 tests triggered — significant structural concerns
            </span>
          </>
        )}
      </div>

      {/* Individual test results */}
      <div className="space-y-2">
        {stressTests.map((test) => {
          const meta = TEST_META[test.test];
          return (
            <div
              key={test.test}
              className={cn(
                "rounded-lg border p-3 flex items-start gap-3",
                test.triggered
                  ? severityBg[test.severity] ?? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  : "bg-muted/20 border-border"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {test.triggered ? (
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      severityColor[test.severity] ?? "text-red-500"
                    )}
                  />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      test.triggered
                        ? severityColor[test.severity] ?? "text-red-600"
                        : "text-foreground"
                    )}
                  >
                    {meta?.label ?? test.test}
                  </span>
                  {test.triggered && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                        test.severity === "High"
                          ? "bg-red-500 text-white"
                          : test.severity === "Medium"
                          ? "bg-amber-500 text-white"
                          : "bg-blue-500 text-white"
                      )}
                    >
                      {test.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {test.triggered ? test.finding : meta?.description ?? test.finding}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
