"use client";

import { useEffect, useRef, useState } from "react";
import { GitGraph } from "lucide-react";

interface DiagramPanelProps {
  content: string | undefined;
  streaming: boolean;
}

export function DiagramPanel({ content, streaming }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    // Don't render while still streaming — wait for complete diagram
    if (streaming || !content?.trim()) return;

    const currentId = ++idRef.current;
    setError(false);

    import("mermaid")
      .then((m) => {
        m.default.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          flowchart: { curve: "basis", useMaxWidth: true },
        });

        // Clean up content: strip backtick fences if the AI added them
        const clean = content
          .replace(/^```(?:mermaid)?\n?/, "")
          .replace(/\n?```$/, "")
          .trim();

        return m.default.render(`diagram-${currentId}`, clean);
      })
      .then(({ svg: rendered }) => {
        if (idRef.current === currentId) {
          setSvg(rendered);
        }
      })
      .catch(() => {
        if (idRef.current === currentId) {
          setError(true);
        }
      });
  }, [content, streaming]);

  if (!content) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center h-40 text-muted-foreground text-sm">
        <GitGraph className="h-4 w-4 mr-2" />
        Diagram will appear when analysis completes…
      </div>
    );
  }

  if (streaming) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center h-40 text-muted-foreground text-sm animate-pulse">
        <GitGraph className="h-4 w-4 mr-2" />
        Building diagram…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <GitGraph className="h-3.5 w-3.5" />
          Diagram syntax (raw)
        </p>
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <GitGraph className="h-3.5 w-3.5" />
        Contract relationship diagram
      </p>
      <div
        ref={containerRef}
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
