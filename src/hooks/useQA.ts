"use client";

import { useCallback, useState } from "react";
import type { QAMessage } from "@/types";

interface SendOptions {
  contractText: string;
  analysisContext: string;
  privacyMode?: boolean;
}

export function useQA() {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(
    async ({ contractText, analysisContext, privacyMode }: SendOptions) => {
      const q = question.trim();
      if (!q || isLoading) return;

      const userMessage: QAMessage = { role: "user", content: q };
      setMessages((prev) => [...prev, userMessage]);
      setQuestion("");
      setIsLoading(true);

      let assistantText = "";

      try {
        const res = await fetch("/api/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractText: contractText.slice(0, 6000),
            analysisContext: analysisContext.slice(0, 3000),
            messages: messages.slice(-12),
            question: q,
            privacyMode: privacyMode ?? false,
          }),
        });

        if (!res.ok) throw new Error("Failed to get answer");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        // Add placeholder assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (typeof payload.delta === "string") {
                  assistantText += payload.delta;
                  setMessages((prev) => {
                    const next = [...prev];
                    next[next.length - 1] = {
                      role: "assistant",
                      content: assistantText,
                    };
                    return next;
                  });
                }
              } catch {
                // not JSON, skip
              }
            }
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content:
              "Sorry, I couldn't get an answer. Please try again.",
          };
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, question, isLoading]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setQuestion("");
  }, []);

  return { messages, question, setQuestion, send, isLoading, reset };
}
