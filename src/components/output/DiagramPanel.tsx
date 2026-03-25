"use client";

import {
  GitGraph,
  Clock,
  AlertTriangle,
  ChevronRight,
  Zap,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { parseJsonSection } from "@/lib/utils/parseSections";
import type {
  ParsedSections,
  Layer1Result,
  AnalysisStatus,
  RedFlag,
  KeyDate,
} from "@/types";

interface DiagramPanelProps {
  layer1Result: Layer1Result | null;
  sections: ParsedSections;
  status: AnalysisStatus;
}

/** Extract bullet-list items from a text section. */
function extractBullets(text: string | undefined, max = 4): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[•\-*·–▪]/.test(l) || /^\d+[.)]\s/.test(l))
    .map((l) => l.replace(/^[•\-*·–▪]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 4)
    .slice(0, max);
}

const urgencyColor: Record<string, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-blue-600 dark:text-blue-400",
};

const urgencyDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

export function DiagramPanel({ layer1Result, sections, status }: DiagramPanelProps) {
  const streaming = status === "streaming" || status === "verifying";

  if (!layer1Result) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center gap-3 min-h-48 text-muted-foreground">
        <GitGraph className="h-9 w-9 opacity-20" />
        <p className="text-sm">
          {status === "layer1" || streaming
            ? "Building diagram…"
            : "Run an analysis to see the contract diagram."}
        </p>
      </div>
    );
  }

  const obligations = extractBullets(sections.OBLIGATIONS, 4);
  const powers = extractBullets(sections.POWERS, 4);
  const timeline = parseJsonSection<KeyDate[]>(sections.TIMELINE, []).slice(0, 4);
  const flags = parseJsonSection<RedFlag[]>(sections.REDFLAGS, []);

  const highCount = flags.filter((f) => f.severity === "High").length;
  const mediumCount = flags.filter((f) => f.severity === "Medium").length;
  const lowCount = flags.filter((f) => f.severity === "Low").length;

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("rounded bg-muted animate-pulse", className)} />
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <GitGraph className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {layer1Result.contractType.replace(/[_-]/g, " ")}
        </span>
        {layer1Result.jurisdiction !== "Not stated" && (
          <span className="text-xs text-muted-foreground">
            · {layer1Result.jurisdiction}
          </span>
        )}
        {!layer1Result.isComplete && (
          <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚠ Excerpt
          </span>
        )}
        {streaming && (
          <span className={cn("text-xs text-muted-foreground animate-pulse", !layer1Result.isComplete ? "ml-2" : "ml-auto")}>
            Updating…
          </span>
        )}
      </div>

      {/* ── Parties ────────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="flex items-stretch gap-3">
          {/* Signer box */}
          <div className="flex-1 rounded-lg border-2 border-primary/40 bg-primary/5 p-3 text-center flex flex-col items-center justify-center gap-0.5">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Signer
            </div>
            <div className="text-sm font-bold text-foreground leading-snug">
              {layer1Result.signerRole}
            </div>
          </div>

          {/* Flow arrows */}
          <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 py-1">
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <span className="text-amber-500 font-bold">←</span>
              <span className="hidden sm:inline">powers</span>
            </div>
            <div className="w-px flex-1 bg-border" />
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <span className="hidden sm:inline">obligations</span>
              <span className="text-primary font-bold">→</span>
            </div>
          </div>

          {/* Counterparty box */}
          <div className="flex-1 rounded-lg border-2 border-amber-500/40 bg-amber-500/5 p-3 text-center flex flex-col items-center justify-center gap-0.5">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Counterparty
            </div>
            <div className="text-sm font-bold text-foreground leading-snug">
              {layer1Result.counterpartyRole}
            </div>
          </div>
        </div>
      </div>

      {/* ── Obligations + Powers ────────────────────────────────────── */}
      <div className="grid grid-cols-2 border-t border-border">
        {/* Obligations column */}
        <div className="p-4 border-r border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Your Obligations
            </span>
          </div>
          {obligations.length > 0 ? (
            <ul className="space-y-2">
              {obligations.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ) : streaming ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        {/* Powers column */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Their Powers
            </span>
          </div>
          {powers.length > 0 ? (
            <ul className="space-y-2">
              {powers.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ) : streaming ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* ── Key Dates + Risk Profile ─────────────────────────────────── */}
      <div className="grid grid-cols-2 border-t border-border">
        {/* Key Dates */}
        <div className="p-4 border-r border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Key Dates
            </span>
          </div>
          {timeline.length > 0 ? (
            <ul className="space-y-2.5">
              {timeline.map((date, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                      urgencyDot[date.urgency] ?? "bg-muted-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground truncate">
                      {date.label}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-semibold",
                        urgencyColor[date.urgency] ?? "text-foreground"
                      )}
                    >
                      {date.value}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : streaming && !sections.TIMELINE ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None found</p>
          )}
        </div>

        {/* Risk Profile */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Risk Profile
            </span>
          </div>
          {sections.REDFLAGS ? (
            flags.length === 0 ? (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                No red flags found
              </p>
            ) : (
              <div className="space-y-2">
                {highCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {highCount} High
                    </span>
                  </div>
                )}
                {mediumCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {mediumCount} Medium
                    </span>
                  </div>
                )}
                {lowCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {lowCount} Low
                    </span>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground pt-0.5 border-t border-border">
                  {flags.length} flag{flags.length !== 1 ? "s" : ""} total
                </div>
              </div>
            )
          ) : streaming ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
