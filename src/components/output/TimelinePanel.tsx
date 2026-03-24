"use client";

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { parseJsonSection } from "@/lib/utils/parseSections";
import type { KeyDate } from "@/types";

interface TimelinePanelProps {
  content?: string;
  streaming?: boolean;
}

const urgencyConfig = {
  high: {
    dot: "bg-red-500",
    label: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  medium: {
    dot: "bg-amber-500",
    label: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  low: {
    dot: "bg-blue-500",
    label: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
};

export function TimelinePanel({ content, streaming }: TimelinePanelProps) {
  const dates = parseJsonSection<KeyDate[]>(content, []);

  if (!content && streaming) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Extracting key dates...
      </div>
    );
  }

  if (!content) return null;

  if (dates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No specific dates or durations found in this contract.</p>
      </div>
    );
  }

  const sorted = [...dates].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{dates.length} time-based clause{dates.length !== 1 ? "s" : ""} found</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((date, i) => {
          const cfg = urgencyConfig[date.urgency];
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-3 section-fade-in",
                cfg.border,
                cfg.bg
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn("w-2 h-2 rounded-full mt-1 shrink-0", cfg.dot)}
                />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {date.label}
                  </p>
                  <p className={cn("text-sm font-semibold mt-0.5", cfg.label)}>
                    {date.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
