"use client";

import { useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils/cn";
import { useQA } from "@/hooks/useQA";
import type { ParsedSections, Layer1Result } from "@/types";

interface QAPanelProps {
  contractText: string;
  sections: ParsedSections;
  layer1Result: Layer1Result | null;
  privacyMode?: boolean;
}

export function QAPanel({
  contractText,
  sections,
  layer1Result,
  privacyMode,
}: QAPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, question, setQuestion, send, isLoading } = useQA();

  const analysisContext = [
    layer1Result
      ? `Contract type: ${layer1Result.contractType}. Jurisdiction: ${layer1Result.jurisdiction}. Parties: ${layer1Result.signerRole} and ${layer1Result.counterpartyRole}.`
      : "",
    sections.SUMMARY ? `Summary: ${sections.SUMMARY}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!question.trim() || isLoading) return;
    send({ contractText, analysisContext, privacyMode });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Ask a question about this contract
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            <p>Ask anything about this contract.</p>
            <p className="text-xs mt-1 opacity-70">
              e.g. "What happens if I quit before 90 days?" or "Can I work for
              competitors?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg p-3 text-sm section-fade-in",
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-8"
                : "bg-muted text-foreground mr-8"
            )}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="bg-muted text-foreground rounded-lg p-3 text-sm mr-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask a question..."
          className="min-h-[44px] max-h-[120px] text-sm py-2.5"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!question.trim() || isLoading}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
