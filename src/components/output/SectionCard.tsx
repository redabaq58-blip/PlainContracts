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

export function SectionCard({
  title,
  icon: Icon,
  content,
  streaming,
  children,
  className,
}: SectionCardProps) {
  const hasContent = !!(content || children);

  if (!hasContent && !streaming) return null;

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
          Generating...
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
