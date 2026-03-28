"use client";

import { useState, useCallback, useEffect } from "react";
import { Lock, Unlock, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { InAppBrowserBanner } from "@/components/layout/InAppBrowserBanner";
import { ContractInput } from "@/components/contract/ContractInput";
import { AudienceSelector } from "@/components/contract/AudienceSelector";
import { ModeToggle } from "@/components/contract/ModeToggle";
import { LanguageSelector } from "@/components/contract/LanguageSelector";
import { AnalyzeButton } from "@/components/contract/AnalyzeButton";
import { PowerScoreGauge } from "@/components/output/PowerScoreGauge";
import { AnalysisPipeline } from "@/components/output/AnalysisPipeline";
import { ResultDocument } from "@/components/output/ResultDocument";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAnalyze } from "@/hooks/useAnalyze";
import { useServerReady } from "@/hooks/useServerReady";
import type { AudienceLevel, AnalysisMode } from "@/types";

export default function AnalyzePage() {
  const {
    status,
    sections,
    layer1Result,
    layer3Result,
    powerScore,
    error,
    analyze,
    reset,
  } = useAnalyze();

  const serverReady = useServerReady();

  const [contractText, setContractText] = useState("");
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>("INFORMED");
  const [mode, setMode] = useState<AnalysisMode>("SIGNER");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [language, setLanguage] = useState("English");

  const isRunning =
    status === "layer1" || status === "extracting" || status === "streaming" || status === "verifying";
  const hasResult = status === "done" || status === "streaming" || status === "verifying";

  const handleAnalyze = useCallback(() => {
    if (!contractText.trim()) return;
    analyze({ contractText, audienceLevel, mode, privacyMode, language });
  }, [contractText, audienceLevel, mode, privacyMode, language, analyze]);

  const handleLevelChange = useCallback(
    (level: AudienceLevel) => {
      setAudienceLevel(level);
      // Re-run with cached Layer 1 if analysis already exists
      if (status === "done" && layer1Result && contractText.trim()) {
        analyze({
          contractText,
          audienceLevel: level,
          mode,
          privacyMode,
          language,
          layer1Cache: layer1Result,
        });
      }
    },
    [status, layer1Result, contractText, mode, privacyMode, language, analyze]
  );

  const handleModeChange = useCallback(
    (newMode: AnalysisMode) => {
      setMode(newMode);
      // Re-run if analysis already exists (mode change always re-runs full pipeline)
      if (status === "done" && contractText.trim()) {
        analyze({ contractText, audienceLevel, mode: newMode, privacyMode, language });
      }
    },
    [status, contractText, audienceLevel, privacyMode, language, analyze]
  );

  const handleReset = () => {
    reset();
    setContractText("");
  };

  // ⌘/Ctrl + Enter keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (contractText.trim() && !isRunning) {
          analyze({ contractText, audienceLevel, mode, privacyMode, language });
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [contractText, audienceLevel, mode, privacyMode, language, isRunning, analyze]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Disclaimer />
      <InAppBrowserBanner />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-8 items-start">
          {/* ── Left: Input ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Analyse a Contract
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Paste contract text or upload a PDF. Results stream in real time.
              </p>
            </div>

            <ContractInput
              value={contractText}
              onChange={setContractText}
              disabled={isRunning}
            />

            {/* Controls row */}
            <div className="flex flex-wrap gap-2 items-center">
              <ModeToggle
                mode={mode}
                onModeChange={handleModeChange}
                disabled={isRunning}
              />
              <AudienceSelector
                level={audienceLevel}
                onLevelChange={handleLevelChange}
                disabled={isRunning}
              />
              <LanguageSelector
                language={language}
                onLanguageChange={setLanguage}
                disabled={isRunning}
              />
              <Tooltip
                content={
                  privacyMode
                    ? "Privacy mode on — no training header active"
                    : "Enable privacy mode — adds no-training header to Anthropic requests"
                }
              >
                <Button
                  variant={privacyMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPrivacyMode(!privacyMode)}
                  disabled={isRunning}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {privacyMode ? (
                    <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                  Privacy
                </Button>
              </Tooltip>

              {hasResult && !isRunning && (
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

            <AnalyzeButton
              onClick={handleAnalyze}
              disabled={!contractText.trim() || isRunning || !serverReady}
              loading={isRunning || !serverReady}
              loadingText={
                !serverReady
                  ? "Connecting to server…"
                  : status === "layer1"
                  ? "Detecting contract type..."
                  : status === "extracting"
                  ? "Running parallel extraction..."
                  : status === "verifying"
                  ? "Verifying red flags..."
                  : "Translating..."
              }
            />

            {/* Keyboard shortcut hint */}
            {!hasResult && (
              <p className="text-xs text-muted-foreground text-center">
                Press{" "}
                <kbd className="text-xs border border-border rounded px-1 py-0.5 font-mono">
                  ⌘ Enter
                </kbd>{" "}
                to analyse
              </p>
            )}
          </div>

          {/* ── Right: Results ───────────────────────────────────────────── */}
          <div>
            {/* Idle state */}
            {status === "idle" && (
              <div className="flex flex-col items-center justify-center h-96 text-center text-muted-foreground rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-sm font-medium">Your analysis will appear here</p>
                <p className="text-xs mt-1 opacity-70">
                  Supports employment, freelance, lease, NDA, service, and more
                </p>
              </div>
            )}

            {/* Error state */}
            {status === "error" && error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
                <p className="text-sm font-medium text-destructive">
                  Analysis failed
                </p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Running or done state */}
            {status !== "idle" && status !== "error" && (
              <div className="space-y-4">
                {/* Pipeline progress */}
                <AnalysisPipeline status={status} layer1Result={layer1Result} />

                {/* Power Score — shown once available */}
                {powerScore !== null && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <PowerScoreGauge score={powerScore} />
                  </div>
                )}

                {/* Unified output document */}
                <ResultDocument
                  sections={sections}
                  status={status}
                  layer1Result={layer1Result}
                  layer3Result={layer3Result}
                  powerScore={powerScore}
                  contractText={contractText}
                  privacyMode={privacyMode}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
