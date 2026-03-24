"use client";

import { cn } from "@/lib/utils/cn";
import type { AnalysisMode } from "@/types";
import { User, Building2 } from "lucide-react";

interface ModeToggleProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      <button
        onClick={() => onModeChange("SIGNER")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
          mode === "SIGNER"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="h-3 w-3" />
        Signer
      </button>
      <button
        onClick={() => onModeChange("SENDER")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
          mode === "SENDER"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="h-3 w-3" />
        Sender
      </button>
    </div>
  );
}
