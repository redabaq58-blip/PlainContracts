"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LANGUAGES = [
  { value: "English", label: "EN" },
  { value: "French", label: "FR" },
  { value: "Spanish", label: "ES" },
  { value: "German", label: "DE" },
  { value: "Portuguese", label: "PT" },
  { value: "Italian", label: "IT" },
  { value: "Arabic", label: "AR" },
  { value: "Chinese (Simplified)", label: "中文" },
  { value: "Japanese", label: "日本語" },
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
          "h-8 rounded-md border border-border bg-background text-xs font-medium px-2 pr-6",
          "text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "appearance-none cursor-pointer"
        )}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
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
