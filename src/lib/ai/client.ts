import Anthropic from "@anthropic-ai/sdk";

function createClient(extraHeaders?: Record<string, string>): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new Anthropic({
    apiKey,
    ...(extraHeaders ? { defaultHeaders: extraHeaders } : {}),
  });
}

let _defaultClient: Anthropic | null = null;

export function getAnthropicClient(privacyMode = false): Anthropic {
  if (privacyMode) {
    // Privacy mode: Anthropic no longer trains on API data by default,
    // so no special header is needed. Fresh uncached client preserved
    // for future privacy-related headers.
    return createClient();
  }
  if (!_defaultClient) {
    _defaultClient = createClient();
  }
  return _defaultClient;
}
