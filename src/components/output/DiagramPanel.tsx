"use client";

import {
  Clock,
  AlertTriangle,
  ChevronRight,
  Zap,
  CheckSquare,
  Scale,
  ShieldCheck,
  ShieldAlert,
  ArrowLeftRight,
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
function extractBullets(text: string | undefined, max = 5): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[•\-*·–▪]/.test(l) || /^\d+[.)]\s/.test(l))
    .map((l) => l.replace(/^[•\-*·–▪]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 4)
    .slice(0, max);
}

/** Extract items after a bold header like "**In return, ..." or "**Your protections:**" */
function extractSubSection(text: string | undefined, marker: string, max = 3): string[] {
  if (!text) return [];
  const idx = text.toLowerCase().indexOf(marker.toLowerCase());
  if (idx === -1) return [];
  const after = text.slice(idx);
  const lines = after.split("\n").slice(1); // skip the header line
  return lines
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

const severityBg: Record<string, string> = {
  High: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  Medium: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Low: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

export function DiagramPanel({ layer1Result, sections, status }: DiagramPanelProps) {
  const streaming = status === "streaming" || status === "verifying";

  if (!layer1Result) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center gap-3 min-h-48 text-muted-foreground">
        <Scale className="h-9 w-9 opacity-20" />
        <p className="text-sm">
          {status === "layer1" || streaming
            ? "Building contract map..."
            : "Run an analysis to see the contract map."}
        </p>
      </div>
    );
  }

  const obligations = extractBullets(sections.OBLIGATIONS, 5);
  const powers = extractBullets(sections.POWERS, 5);
  const protections = extractSubSection(sections.POWERS, "your protections", 3);
  const theirObligations = extractSubSection(sections.OBLIGATIONS, "in return", 3);
  const timeline = parseJsonSection<KeyDate[]>(sections.TIMELINE, []).slice(0, 5);
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
      <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center gap-3">
        <Scale className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground capitalize">
            {layer1Result.contractType.replace(/[_-]/g, " ")}
          </span>
          {layer1Result.jurisdiction !== "Not stated" && (
            <span className="text-xs text-muted-foreground ml-2">
              {layer1Result.jurisdiction}
            </span>
          )}
        </div>
        {!layer1Result.isComplete && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded">
            Excerpt
          </span>
        )}
        {streaming && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Analysing...
          </span>
        )}
      </div>

      {/* ── Parties + Relationship ────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="flex items-stretch gap-4">
          {/* Signer box */}
          <div className="flex-1 rounded-xl border-2 border-primary/40 bg-primary/5 p-4 flex flex-col items-center justify-center gap-1">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
              You (Signer)
            </div>
            <div className="text-sm font-bold text-foreground leading-snug text-center">
              {layer1Result.signerRole}
            </div>
            {protections.length > 0 && (
              <div className="mt-2 w-full">
                <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium mb-1">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Your protections
                </div>
                {protections.map((p, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground leading-snug truncate">
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flow indicator */}
          <div className="flex flex-col items-center justify-center gap-2 shrink-0 py-2">
            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
              Their Powers
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-500 font-bold text-sm">&larr;</span>
              <Zap className="h-3 w-3 text-amber-500" />
            </div>
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3 text-primary" />
              <span className="text-primary font-bold text-sm">&rarr;</span>
            </div>
            <div className="text-[9px] font-bold text-primary uppercase tracking-wider">
              Your Duties
            </div>
          </div>

          {/* Counterparty box */}
          <div className="flex-1 rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 flex flex-col items-center justify-center gap-1">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Counterparty
            </div>
            <div className="text-sm font-bold text-foreground leading-snug text-center">
              {layer1Result.counterpartyRole}
            </div>
            {theirObligations.length > 0 && (
              <div className="mt-2 w-full">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-1">
                  <CheckSquare className="h-2.5 w-2.5" />
                  Their duties
                </div>
                {theirObligations.map((o, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground leading-snug truncate">
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Obligations + Powers Detail ──────────────────────────── */}
      <div className="grid grid-cols-2 border-t border-border">
        {/* Your Obligations */}
        <div className="p-4 border-r border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Your Obligations
            </span>
          </div>
          {obligations.length > 0 ? (
            <ul className="space-y-1.5">
              {obligations.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground leading-snug line-clamp-2">
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

        {/* Their Powers */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Their Powers
            </span>
          </div>
          {powers.length > 0 ? (
            <ul className="space-y-1.5">
              {powers.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground leading-snug line-clamp-2">
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

      {/* ── Risk Matrix + Key Dates ─────────────────────────────── */}
      <div className="grid grid-cols-2 border-t border-border">
        {/* Risk Matrix */}
        <div className="p-4 border-r border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Risk Assessment
            </span>
          </div>
          {sections.REDFLAGS ? (
            flags.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                No red flags identified
              </div>
            ) : (
              <div className="space-y-2">
                {/* Severity bars */}
                {highCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {highCount} High Risk
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, highCount * 33)}%` }}
                      />
                    </div>
                  </div>
                )}
                {mediumCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {mediumCount} Medium
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, mediumCount * 33)}%` }}
                      />
                    </div>
                  </div>
                )}
                {lowCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {lowCount} Low
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, lowCount * 33)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Top flags */}
                <div className="pt-2 border-t border-border space-y-1.5">
                  {flags.slice(0, 3).map((flag, i) => (
                    <div key={i} className={cn("text-[10px] leading-snug rounded px-2 py-1 border", severityBg[flag.severity] ?? "")}>
                      <span className="font-bold">{flag.clauseRef}:</span>{" "}
                      <span className="opacity-90">{flag.explanation.slice(0, 80)}{flag.explanation.length > 80 ? "..." : ""}</span>
                    </div>
                  ))}
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

        {/* Key Dates */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Key Dates &amp; Deadlines
            </span>
          </div>
          {timeline.length > 0 ? (
            <ul className="space-y-2.5">
              {timeline.map((date, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0 mt-1",
                      urgencyDot[date.urgency] ?? "bg-muted-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground truncate font-medium">
                      {date.label}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-bold",
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
            <p className="text-xs text-muted-foreground">No dates found</p>
          )}
        </div>
      </div>
    </div>
  );
}
