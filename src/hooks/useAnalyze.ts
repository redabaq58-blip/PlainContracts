"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AnalysisState,
  AnalysisStatus,
  AudienceLevel,
  AnalysisMode,
  Layer1Result,
  SectionKey,
} from "@/types";

const INITIAL_STATE: AnalysisState = {
  status: "idle",
  rawText: "",
  sections: {},
  layer1Result: null,
  layer3Result: null,
  powerScore: null,
  error: null,
};

interface AnalyzeOptions {
  contractText: string;
  audienceLevel: AudienceLevel;
  mode: AnalysisMode;
  privacyMode?: boolean;
  layer1Cache?: Layer1Result;
  language?: string;
}

export function useAnalyze() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const setStatus = (status: AnalysisStatus) =>
    setState((s) => ({ ...s, status }));

  const analyze = useCallback(async (options: AnalyzeOptions) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      ...INITIAL_STATE,
      status: "layer1",
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: options.contractText,
          audienceLevel: options.audienceLevel,
          mode: options.mode,
          privacyMode: options.privacyMode ?? false,
          layer1Cache: options.layer1Cache,
          language: options.language ?? "English",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.error === "string" && err.error.length < 120 && !err.error.includes("{")
          ? err.error
          : "Analysis failed. Please try again.";
        throw new Error(msg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      let receivedDone = false;

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

              if (event.type === "layer1") {
                setState((s) => ({
                  ...s,
                  status: "streaming",
                  layer1Result: event.result,
                }));
              } else if (event.type === "delta") {
                const sectionKey = event.section as SectionKey;
                setState((s) => ({
                  ...s,
                  sections: {
                    ...s.sections,
                    [sectionKey]: ((s.sections[sectionKey] ?? "") + event.text),
                  },
                }));
              } else if (event.type === "section_revised") {
                const sectionKey = event.section as SectionKey;
                setState((s) => ({
                  ...s,
                  sections: {
                    ...s.sections,
                    [sectionKey]: event.text,
                  },
                }));
              } else if (event.type === "verifying") {
                setStatus("verifying");
              } else if (event.type === "layer3") {
                setState((s) => ({
                  ...s,
                  layer3Result: event.result,
                  powerScore: event.powerScore ?? null,
                }));
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Analysis failed");
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue; // not JSON
              throw parseErr;
            }
          } else if (line.startsWith("done: ")) {
            receivedDone = true;
            setState((s) => ({ ...s, status: "done" }));
          }
        }
      }

      // Fallback: if stream ended without a done event, finalize status
      if (!receivedDone) {
        setState((s) =>
          s.status !== "done" && s.status !== "error"
            ? { ...s, status: "done" }
            : s
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, analyze, reset };
}
