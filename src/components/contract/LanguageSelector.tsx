"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LANGUAGES = [
  { value: "English",    label: "English"    },
  { value: "French",     label: "Français"   },
  { value: "Spanish",    label: "Español"    },
  { value: "German",     label: "Deutsch"    },
  { value: "Portuguese", label: "Português"  },
  { value: "Italian",    label: "Italiano"   },
];

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  language,
  onLanguageChange,
  disabled,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-8 rounded-md border border-border px-2 text-xs font-medium",
          "bg-background text-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
