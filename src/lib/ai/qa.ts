import { getAnthropicClient } from "./client";
import type { QAMessage } from "@/types";

/**
 * Streams a Q&A answer with full contract context.
 * Uses Claude Haiku for cost efficiency on follow-up questions.
 */
export async function* streamQAAnswer(
  contractText: string,
  analysisContext: string,
  messages: QAMessage[],
  question: string,
  privacyMode = false
): AsyncGenerator<string> {
  const client = getAnthropicClient(privacyMode);

  // Keep last 6 pairs (12 messages) to manage context window
  const recentMessages = messages.slice(-12);

  const systemPrompt = `You are a contract Q&A assistant. A user has had their contract analysed and now has follow-up questions. Answer their questions clearly and accurately based on the contract text and analysis provided.

Important:
- Answer based only on what is actually in the contract
- If you cannot find the answer in the contract, say so directly
- Do not provide legal advice — explain what the contract says
- Keep answers concise and plain

CONTRACT (first 3000 chars):
${contractText.slice(0, 3000)}

ANALYSIS SUMMARY:
${analysisContext.slice(0, 2000)}`;

  const allMessages: QAMessage[] = [
    ...recentMessages,
    { role: "user", content: question },
  ];

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: systemPrompt,
    messages: allMessages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
