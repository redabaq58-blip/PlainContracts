"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { MAX_CONTRACT_CHARS } from "@/constants";
import { useServerReady } from "@/hooks/useServerReady";

interface ContractInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ContractInput({ value, onChange, disabled }: ContractInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [showChromeHint, setShowChromeHint] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const serverReady = useServerReady();

  const handleFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }

    setPdfLoading(true);
    setPdfFilename(file.name);

    const attemptUpload = async (retry = 0): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to parse PDF");
      }

      const { text } = await res.json();
      if (text.length > MAX_CONTRACT_CHARS) {
        toast.warning(
          `PDF is long — only the first ${MAX_CONTRACT_CHARS.toLocaleString()} characters will be analysed.`
        );
      }
      onChange(text.slice(0, MAX_CONTRACT_CHARS));
    };

    const isNetworkError = (e: unknown) => {
      const m = e instanceof Error ? e.message : "";
      return m === "Failed to fetch" || m === "" || m === "Network request failed";
    };

    try {
      await attemptUpload();
    } catch (err) {
      if (!isNetworkError(err)) {
        toast.error(err instanceof Error ? err.message : "Failed to read PDF");
        setPdfFilename(null);
        setPdfLoading(false);
        return;
      }

      // Network / cold-start failure — retry up to 2 more times
      const delays = [4000, 7000];
      let lastErr: unknown = err;
      for (let attempt = 0; attempt < delays.length; attempt++) {
        setRetryMessage(`Server is starting up… retrying (${attempt + 1}/2)`);
        await new Promise((r) => setTimeout(r, delays[attempt]));
        setRetryMessage(null);
        try {
          await attemptUpload(attempt + 1);
          setPdfLoading(false);
          return; // success
        } catch (e) {
          lastErr = e;
          if (!isNetworkError(e)) break; // non-network error — stop retrying
        }
      }

      // All retries exhausted
      if (isNetworkError(lastErr)) {
        setShowChromeHint(true);
        toast.error("Could not reach the server. Try opening the page directly in Chrome.");
      } else {
        toast.error(lastErr instanceof Error ? lastErr.message : "Failed to read PDF");
      }
      setPdfFilename(null);
    } finally {
      setPdfLoading(false);
      setRetryMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    onChange("");
    setPdfFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const charCount = value.length;
  const charPercent = Math.min(100, (charCount / MAX_CONTRACT_CHARS) * 100);
  const nearLimit = charPercent >= 90;
  const atLimit = charCount >= MAX_CONTRACT_CHARS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Contract Text
        </label>
        <div className="flex items-center gap-2">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { if (serverReady) fileInputRef.current?.click(); }}
            disabled={disabled || pdfLoading || !serverReady}
            className="h-7 px-3 text-xs"
          >
            {!serverReady ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Connecting…
              </>
            ) : pdfLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {retryMessage ?? "Reading PDF…"}
              </>
            ) : (
              <>
                <Upload className="h-3 w-3 mr-1" />
                Upload PDF
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", zIndex: -1 }}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // Reset so the same file can be re-selected if needed
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {showChromeHint && (
        <div className="flex items-center gap-2 text-xs rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-blue-800 dark:text-blue-300">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span>
            Connection failed.{" "}
            <a
              href={typeof window !== "undefined"
                ? `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
                : "#"}
              className="font-semibold underline underline-offset-2"
            >
              Tap here to open in Chrome
            </a>
            {" "}or tap ⋮ → <strong>Open in Chrome</strong> in your browser.
          </span>
          <button onClick={() => setShowChromeHint(false)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {pdfFilename && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-1.5">
          <FileText className="h-3 w-3 text-primary" />
          <span className="font-medium text-foreground">{pdfFilename}</span>
          <span className="text-muted-foreground">— loaded successfully</span>
        </div>
      )}

      <div
        className={cn(
          "relative rounded-lg transition-colors",
          isDragging && "ring-2 ring-primary ring-offset-2"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/10 border-2 border-dashed border-primary pointer-events-none">
            <div className="text-sm font-medium text-primary">
              Drop PDF here
            </div>
          </div>
        )}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CONTRACT_CHARS))}
          disabled={disabled}
          placeholder="Paste your contract text here, or drag and drop a PDF file above...

Example: Employment Agreement, Lease Agreement, NDA, Freelance Contract, Service Agreement…"
          className="min-h-[320px] font-mono text-xs leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(nearLimit && "text-amber-600 dark:text-amber-400 font-medium")}>
          {charCount.toLocaleString()} / {MAX_CONTRACT_CHARS.toLocaleString()} characters
        </span>
        {charCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  nearLimit ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {atLimit && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Contract truncated at {MAX_CONTRACT_CHARS.toLocaleString()} characters.
            Clauses beyond this limit will not be analysed.
          </span>
        </div>
      )}
    </div>
  );
}
