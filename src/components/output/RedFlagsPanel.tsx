"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Mail, FileEdit } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils/cn";
import { parseJsonSection } from "@/lib/utils/parseSections";
import type { RedFlag, Severity } from "@/types";

interface RedFlagsPanelProps {
  content?: string;
  streaming?: boolean;
}

function severityVariant(severity: Severity) {
  if (severity === "High") return "high";
  if (severity === "Medium") return "medium";
  return "low";
}

function RedFlagCard({ flag }: { flag: RedFlag }) {
  const [showEmail, setShowEmail] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4 section-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            flag.severity === "High"
              ? "text-red-500"
              : flag.severity === "Medium"
              ? "text-amber-500"
              : "text-blue-500"
          )}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityVariant(flag.severity)}>
              {flag.severity}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              {flag.clauseRef}
            </span>
          </div>

          <p className="text-sm text-foreground">{flag.explanation}</p>

          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2.5 py-1.5">
            <span className="font-medium text-foreground">Tip:</span>
            <span>{flag.negotiationTip}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setShowEmail(!showEmail)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {showEmail ? "Hide" : "Show"} negotiation email
              {showEmail ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {flag.clauseRewrite && (
              <button
                onClick={() => setShowRewrite(!showRewrite)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileEdit className="h-3 w-3" />
                {showRewrite ? "Hide" : "See"} clause rewrite
                {showRewrite ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Negotiation email */}
          {showEmail && flag.negotiationEmail && (
            <div className="mt-2 section-fade-in">
              <div className="rounded-md border border-border bg-muted/50 p-3 relative">
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={flag.negotiationEmail}
                    label="Copy email"
                  />
                </div>
                <p className="text-xs text-foreground leading-relaxed pr-24">
                  {flag.negotiationEmail}
                </p>
              </div>
            </div>
          )}

          {/* Clause rewrite */}
          {showRewrite && flag.clauseRewrite && (
            <div className="mt-2 section-fade-in">
              <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-3 relative">
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={flag.clauseRewrite}
                    label="Copy"
                  />
                </div>
                <p className="text-xs font-medium text-green-800 dark:text-green-400 mb-1.5">
                  Suggested rewrite:
                </p>
                <p className="text-xs text-foreground leading-relaxed pr-20 font-mono">
                  {flag.clauseRewrite}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RedFlagsPanel({ content, streaming }: RedFlagsPanelProps) {
  const flags = parseJsonSection<RedFlag[]>(content, []);

  if (!content && streaming) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Identifying red flags...
      </div>
    );
  }

  if (!content) return null;

  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
        <p className="text-sm text-green-800 dark:text-green-400 font-medium">
          No significant red flags found.
        </p>
        <p className="text-xs text-green-700 dark:text-green-500 mt-1">
          This contract appears to be relatively balanced. Always read it
          yourself and consult an attorney for important decisions.
        </p>
      </div>
    );
  }

  const highCount = flags.filter((f) => f.severity === "High").length;
  const mediumCount = flags.filter((f) => f.severity === "Medium").length;
  const lowCount = flags.filter((f) => f.severity === "Low").length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs">
        {highCount > 0 && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {highCount} High
          </span>
        )}
        {mediumCount > 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {mediumCount} Medium
          </span>
        )}
        {lowCount > 0 && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {lowCount} Low
          </span>
        )}
      </div>

      {flags.map((flag, i) => (
        <RedFlagCard key={i} flag={flag} />
      ))}
    </div>
  );
}
