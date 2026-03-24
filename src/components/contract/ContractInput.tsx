"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { MAX_CONTRACT_CHARS } from "@/constants";

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

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10 MB.");
      return;
    }

    setPdfLoading(true);
    setPdfFilename(file.name);

    try {
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
      onChange(text.slice(0, MAX_CONTRACT_CHARS));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to read PDF");
      setPdfFilename(null);
    } finally {
      setPdfLoading(false);
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
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || pdfLoading}
            className="h-7 px-3 text-xs"
          >
            {pdfLoading ? (
              <>
                <span className="animate-spin mr-1">⟳</span>
                Reading PDF...
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
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>

      {pdfFilename && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-1.5">
          <FileText className="h-3 w-3" />
          <span>{pdfFilename}</span>
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

Example: Employment Agreement, Lease Agreement, NDA, Freelance Contract, Service Agreement..."
          className="min-h-[320px] font-mono text-xs leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {charCount.toLocaleString()} / {MAX_CONTRACT_CHARS.toLocaleString()} characters
        </span>
        {charCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  charPercent > 90 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
