"use client";

import type { LucideIcon } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils/cn";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  content?: string;
  streaming?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Renders plain-text section content with proper visual hierarchy.
 * - Lines starting with a bullet marker → styled bullet row
 * - Lines starting with a digit → numbered item
 * - Everything else → paragraph
 */
function FormattedContent({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trimEnd());

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const bulletMatch = trimmed.match(/^[•\-*·–▪]\s*(.*)/);
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);

    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2.5 py-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-sm text-foreground leading-relaxed flex-1">
            {bulletMatch[1]}
          </span>
        </div>
      );
    } else if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2.5 py-0.5">
          <span className="text-xs font-semibold text-primary shrink-0 w-5 text-right mt-0.5">
            {numberedMatch[1]}.
          </span>
          <span className="text-sm text-foreground leading-relaxed flex-1">
            {numberedMatch[2]}
          </span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground leading-relaxed">
          {trimmed}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export function SectionCard({
  title,
  icon: Icon,
  content,
  streaming,
  children,
  className,
}: SectionCardProps) {
  const hasContent = !!(content || children);

  if (!hasContent && !streaming) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground",
          className
        )}
      >
        No content available for this section.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 section-fade-in",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {content && <CopyButton text={content} />}
      </div>

      {children ? (
        <div>{children}</div>
      ) : streaming && !content ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Generating…
        </div>
      ) : (
        <FormattedContent text={content!} />
      )}
    </div>
  );
}
