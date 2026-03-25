"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileSignature,
  Copy,
  Printer,
  Loader2,
  Lock,
  Unlock,
  Globe,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils/cn";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  "NDA",
  "Employment",
  "Freelance",
  "Lease",
  "Service Agreement",
  "Partnership",
  "Consulting",
  "License Agreement",
  "Sales Agreement",
  "Joint Venture",
];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "French", label: "Français" },
  { value: "Spanish", label: "Español" },
  { value: "German", label: "Deutsch" },
  { value: "Portuguese", label: "Português" },
  { value: "Italian", label: "Italiano" },
];

type Status = "idle" | "generating" | "done" | "error";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  // Form state
  const [contractType, setContractType] = useState("NDA");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [keyTerms, setKeyTerms] = useState("");
  const [language, setLanguage] = useState("English");
  const [privacyMode, setPrivacyMode] = useState(false);

  // Generation state
  const [status, setStatus] = useState<Status>("idle");
  const [generatedText, setGeneratedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const isGenerating = status === "generating";
  const hasResult = status === "done" || status === "generating";

  const canGenerate =
    contractType.trim() &&
    partyA.trim() &&
    partyB.trim() &&
    jurisdiction.trim() &&
    keyTerms.trim().length >= 10;

  // ── Generate handler ─────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("generating");
    setGeneratedText("");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractType,
          partyA,
          partyB,
          jurisdiction,
          keyTerms,
          language,
          privacyMode,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          typeof err.error === "string" &&
          err.error.length < 120 &&
          !err.error.includes("{")
            ? err.error
            : "Generation failed. Please try again.";
        throw new Error(msg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "delta") {
                setGeneratedText((prev) => prev + event.text);
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Generation failed");
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          } else if (line.startsWith("done: ")) {
            setStatus("done");
          }
        }
      }

      // Ensure done status even if the done event was missed
      setStatus((s) => (s === "generating" ? "done" : s));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [contractType, partyA, partyB, jurisdiction, keyTerms, language, privacyMode]);

  // ── Copy handler ─────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedText]);

  // ── Export PDF (print) ───────────────────────────────────────────────────

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setGeneratedText("");
    setError(null);
  };

  // ── Keyboard shortcut ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (canGenerate && !isGenerating) {
          generate();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [canGenerate, isGenerating, generate]);

  // ── Auto-scroll during generation ────────────────────────────────────────

  useEffect(() => {
    if (status === "generating" && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedText, status]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr] gap-8 items-start">
          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Generate a Contract
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your contract needs and get a professional,
                stress-tested draft.
              </p>
            </div>

            {/* Contract Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Contract Type
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                disabled={isGenerating}
                className={cn(
                  "w-full h-10 rounded-md border border-input px-3 text-sm",
                  "bg-background text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                )}
              >
                {CONTRACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Party A & B */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Party A
                </label>
                <input
                  type="text"
                  value={partyA}
                  onChange={(e) => setPartyA(e.target.value)}
                  placeholder="e.g. Acme Corp (Disclosing Party)"
                  disabled={isGenerating}
                  className={cn(
                    "w-full h-10 rounded-md border border-input px-3 text-sm",
                    "bg-background text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Party B
                </label>
                <input
                  type="text"
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value)}
                  placeholder="e.g. Jane Smith (Receiving Party)"
                  disabled={isGenerating}
                  className={cn(
                    "w-full h-10 rounded-md border border-input px-3 text-sm",
                    "bg-background text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                />
              </div>
            </div>

            {/* Jurisdiction */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Jurisdiction
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. State of California, USA"
                disabled={isGenerating}
                className={cn(
                  "w-full h-10 rounded-md border border-input px-3 text-sm",
                  "bg-background text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
            </div>

            {/* Key Terms */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Key Terms & Requirements
              </label>
              <Textarea
                value={keyTerms}
                onChange={(e) => setKeyTerms(e.target.value)}
                placeholder="Describe what the contract should cover: duration, payment terms, scope of work, special conditions, etc."
                disabled={isGenerating}
                className="min-h-[120px]"
              />
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isGenerating}
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

              <Button
                variant={privacyMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPrivacyMode(!privacyMode)}
                disabled={isGenerating}
                className="h-8 px-3 text-xs gap-1.5"
              >
                {privacyMode ? (
                  <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                Privacy
              </Button>

              {hasResult && !isGenerating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-3 text-xs gap-1.5 ml-auto text-muted-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              )}
            </div>

            {/* Generate button */}
            <Button
              onClick={generate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-11 text-sm font-semibold gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating contract...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" />
                  Generate Contract
                </>
              )}
            </Button>

            {/* Keyboard shortcut hint */}
            {!hasResult && (
              <p className="text-xs text-muted-foreground text-center">
                Press{" "}
                <kbd className="text-xs border border-border rounded px-1 py-0.5 font-mono">
                  ⌘ Enter
                </kbd>{" "}
                to generate
              </p>
            )}
          </div>

          {/* ── Right: Output ─────────────────────────────────────────── */}
          <div>
            {/* Idle state */}
            {status === "idle" && (
              <div className="flex flex-col items-center justify-center h-96 text-center text-muted-foreground rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileSignature className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  Your generated contract will appear here
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Supports NDA, employment, freelance, lease, service, and more
                </p>
              </div>
            )}

            {/* Error state */}
            {status === "error" && error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
                <p className="text-sm font-medium text-destructive">
                  Generation failed
                </p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generate}
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Generating or done */}
            {(status === "generating" || status === "done") && (
              <div className="space-y-3">
                {/* Action bar */}
                {status === "done" && (
                  <div className="flex items-center gap-2 justify-end print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      <Printer className="h-3 w-3" />
                      Export PDF
                    </Button>
                  </div>
                )}

                {/* Document container */}
                <div
                  ref={outputRef}
                  className={cn(
                    "rounded-xl border border-border bg-card shadow-sm",
                    "max-h-[80vh] overflow-y-auto",
                    "print:max-h-none print:overflow-visible print:shadow-none print:border-none"
                  )}
                >
                  <div
                    className={cn(
                      "px-8 py-10 sm:px-12 sm:py-12",
                      "prose prose-sm dark:prose-invert max-w-none",
                      "prose-headings:font-bold prose-headings:text-foreground",
                      "prose-h1:text-xl prose-h1:text-center prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-border",
                      "prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3",
                      "prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2",
                      "prose-p:text-foreground/90 prose-p:leading-relaxed",
                      "prose-strong:text-foreground",
                      "prose-li:text-foreground/90",
                      "font-serif"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(generatedText),
                    }}
                  />

                  {/* Streaming cursor */}
                  {status === "generating" && (
                    <div className="px-8 pb-6 sm:px-12">
                      <span className="inline-block w-2 h-5 bg-primary/60 animate-pulse rounded-sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Simple Markdown to HTML converter ───────────────────────────────────────
// Converts basic Markdown (headings, bold, italic, lists, paragraphs) to HTML.
// This avoids pulling in a full Markdown library.

function markdownToHtml(md: string): string {
  if (!md) return "";

  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }
      html.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }
      html.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }
      html.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }
      html.push("<hr />");
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*]\s/.test(line)) {
      if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inlineFormat(line.replace(/^[\s]*[-*]\s/, ""))}</li>`);
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+[.)]\s/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (!inOrderedList) { html.push("<ol>"); inOrderedList = true; }
      html.push(`<li>${inlineFormat(line.replace(/^[\s]*\d+[.)]\s/, ""))}</li>`);
      continue;
    }

    // Close open lists
    if (inList) { html.push("</ul>"); inList = false; }
    if (inOrderedList) { html.push("</ol>"); inOrderedList = false; }

    // Empty line
    if (line.trim() === "") {
      continue;
    }

    // Paragraph
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) html.push("</ul>");
  if (inOrderedList) html.push("</ol>");

  return html.join("\n");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}
