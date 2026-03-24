"use client";

import { cn } from "@/lib/utils/cn";
import { AUDIENCE_LEVELS } from "@/constants";
import type { AudienceLevel } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";

interface AudienceSelectorProps {
  level: AudienceLevel;
  onLevelChange: (level: AudienceLevel) => void;
  disabled?: boolean;
}

export function AudienceSelector({
  level,
  onLevelChange,
  disabled,
}: AudienceSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {AUDIENCE_LEVELS.map((opt) => (
        <Tooltip key={opt.value} content={opt.description}>
          <button
            onClick={() => onLevelChange(opt.value)}
            disabled={disabled}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all",
              level === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
