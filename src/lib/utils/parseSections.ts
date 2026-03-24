import type { SectionKey, ParsedSections } from "@/types";

const DELIMITER_RE = /<!-- SECTION:(\w+) -->/g;

/**
 * Parses streamed Layer 2 output into named sections.
 * Sections are delimited by <!-- SECTION:KEY --> markers.
 * Returns whatever has been streamed so far — safe to call incrementally.
 */
export function parseSections(text: string): ParsedSections {
  const sections: ParsedSections = {};
  const matches = [...text.matchAll(DELIMITER_RE)];

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1] as SectionKey;
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      sections[key] = content;
    }
  }

  return sections;
}

/**
 * Safely parse JSON from a section string.
 * Returns fallback value if parsing fails.
 */
export function parseJsonSection<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}
