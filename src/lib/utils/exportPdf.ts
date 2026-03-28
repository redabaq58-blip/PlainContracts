import type { Layer1Result, Layer3Result, RedFlag, KeyDate, StressTestResult } from "@/types";
import type { ParsedSections } from "@/types";

// ─── Markdown → HTML (minimal, for contract rendering) ───────────────────────

function mdToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$2</h2>".replace("$2", "$1"))
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // HR
    .replace(/^---$/gm, "<hr>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists — consecutive lines
    .replace(/((?:^[•\-*] .+\n?)+)/gm, (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((l) => `<li>${l.replace(/^[•\-*] /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    })
    // Ordered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    })
    // Paragraphs — blank-line-separated blocks not already tagged
    .replace(/^(?!<[huo\d/]|<hr|<li|<p)(.+)$/gm, "<p>$1</p>")
    .replace(/\n{2,}/g, "\n");
}

// ─── Shared print styles ──────────────────────────────────────────────────────

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.65; color: #111; background: #fff; padding: 0; }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 56px; }
  h1 { font-size: 20pt; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 14pt; font-weight: 700; margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 12pt; font-weight: 700; margin: 16px 0 6px; }
  h4 { font-size: 11pt; font-weight: 700; margin: 12px 0 4px; }
  p { margin: 6px 0; }
  ul, ol { margin: 8px 0 8px 20px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  .meta { font-size: 10pt; color: #555; margin-bottom: 24px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #444; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; font-size: 9pt; font-weight: 600; padding: 2px 8px; border-radius: 99px; margin-right: 4px; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .badge-amber { background: #fef3c7; color: #b45309; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .flag { margin: 8px 0; padding: 8px 10px; border-radius: 6px; border-left: 3px solid; }
  .flag-high { background: #fef2f2; border-color: #ef4444; }
  .flag-medium { background: #fffbeb; border-color: #f59e0b; }
  .flag-low { background: #eff6ff; border-color: #3b82f6; }
  .flag-title { font-weight: 700; font-size: 10pt; }
  .flag-body { font-size: 10pt; margin-top: 3px; color: #374151; }
  .stress { display: flex; align-items: flex-start; gap: 8px; margin: 6px 0; padding: 6px 10px; border-radius: 5px; border: 1px solid #e5e7eb; }
  .stress-triggered { border-color: #fca5a5; background: #fef2f2; }
  .stress-ok { border-color: #bbf7d0; background: #f0fdf4; }
  .stress-icon { font-size: 12pt; line-height: 1.4; }
  .stress-body { flex: 1; }
  .stress-name { font-weight: 700; font-size: 10pt; }
  .stress-finding { font-size: 10pt; color: #374151; margin-top: 2px; }
  .score-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .score-num { font-size: 28pt; font-weight: 800; }
  .score-label { font-size: 10pt; color: #555; }
  .disclaimer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9pt; color: #888; }
  .date-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-high { background: #ef4444; }
  .dot-medium { background: #f59e0b; }
  .dot-low { background: #3b82f6; }
  strong { font-weight: 700; }
  @media print {
    body { padding: 0; }
    .page { padding: 28px 36px; }
    @page { margin: 0.6in 0.7in; }
  }
`;

// ─── Export Analysis Report ───────────────────────────────────────────────────

export function exportAnalysisPDF(
  layer1Result: Layer1Result | null,
  sections: ParsedSections,
  powerScore: number | null,
  layer3Result: Layer3Result | null
): void {
  let flags: RedFlag[] = [];
  try { flags = JSON.parse(sections.REDFLAGS ?? "[]"); } catch { /* empty */ }

  let dates: KeyDate[] = [];
  try { dates = JSON.parse(sections.TIMELINE ?? "[]"); } catch { /* empty */ }

  const stressTests: StressTestResult[] = layer3Result?.stressTests ?? [];

  const stressLabel: Record<string, string> = {
    interplay: "Liability Cap vs Indemnity Inter-play",
    soleRemedy: "Sole Remedy Trap",
    successorRisk: "Change of Control / Successor Risk",
    contraProferentem: "Contra Proferentem / Drafting Ambiguity",
    uncappedIndemnity: "Uncapped Indemnity Exposure",
  };

  const scoreColor = powerScore === null ? "#555" : powerScore >= 70 ? "#15803d" : powerScore >= 45 ? "#b45309" : "#b91c1c";

  const renderFlags = flags
    .map(
      (f) => `
    <div class="flag flag-${f.severity.toLowerCase()}">
      <div class="flag-title">${escHtml(f.clauseRef)} <span class="badge badge-${f.severity === "High" ? "red" : f.severity === "Medium" ? "amber" : "blue"}">${escHtml(f.severity)}</span></div>
      <div class="flag-body">${escHtml(f.explanation)}</div>
      ${f.negotiationTip ? `<div class="flag-body" style="margin-top:4px;font-style:italic">Tip: ${escHtml(f.negotiationTip)}</div>` : ""}
    </div>`
    )
    .join("");

  const renderDates = dates
    .map(
      (d) => `
    <div class="date-row">
      <div class="dot dot-${d.urgency}"></div>
      <div><strong>${escHtml(d.label)}:</strong> ${escHtml(d.value)}</div>
    </div>`
    )
    .join("");

  const renderStress = stressTests
    .map(
      (t) => `
    <div class="stress ${t.triggered ? "stress-triggered" : "stress-ok"}">
      <div class="stress-icon">${t.triggered ? "⚠️" : "✅"}</div>
      <div class="stress-body">
        <div class="stress-name">${escHtml(stressLabel[t.test] ?? t.test)}</div>
        <div class="stress-finding">${escHtml(t.finding)}</div>
      </div>
    </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contract Analysis Report — PlainContracts</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
<div class="page">

  <h1>Contract Analysis Report</h1>
  ${
    layer1Result
      ? `<div class="meta">
          <strong>${escHtml(layer1Result.contractType.replace(/[_-]/g, " "))}</strong>
          &nbsp;·&nbsp; ${escHtml(layer1Result.jurisdiction)}
          &nbsp;·&nbsp; You: <em>${escHtml(layer1Result.signerRole)}</em>
          &nbsp;·&nbsp; Counterparty: <em>${escHtml(layer1Result.counterpartyRole)}</em>
          ${layer1Result.voidRisk ? `&nbsp;·&nbsp; <span class="badge badge-red">⚠ Void Risk</span>` : ""}
        </div>`
      : ""
  }

  ${
    powerScore !== null
      ? `<div class="score-row">
          <div class="score-num" style="color:${scoreColor}">${powerScore}</div>
          <div class="score-label">Fairness Score (0–100)<br><span style="font-size:9pt">Higher = more balanced contract</span></div>
        </div>`
      : ""
  }

  ${
    sections.SUMMARY
      ? `<div class="section"><div class="section-title">Plain Summary</div>${mdToHtml(sections.SUMMARY)}</div>`
      : ""
  }

  ${
    sections.OBLIGATIONS
      ? `<div class="section"><div class="section-title">Your Obligations</div>${mdToHtml(sections.OBLIGATIONS)}</div>`
      : ""
  }

  ${
    sections.POWERS
      ? `<div class="section"><div class="section-title">Their Powers</div>${mdToHtml(sections.POWERS)}</div>`
      : ""
  }

  ${
    flags.length > 0
      ? `<div class="section"><div class="section-title">Red Flags (${flags.length})</div>${renderFlags}</div>`
      : ""
  }

  ${
    sections.MISSING
      ? `<div class="section"><div class="section-title">Missing Clauses</div>${mdToHtml(sections.MISSING)}</div>`
      : ""
  }

  ${
    dates.length > 0
      ? `<div class="section"><div class="section-title">Key Dates &amp; Deadlines</div>${renderDates}</div>`
      : ""
  }

  ${
    stressTests.length > 0
      ? `<div class="section"><div class="section-title">Senior Partner Stress Tests</div>${renderStress}</div>`
      : ""
  }

  ${
    sections.CONFIDENCE
      ? `<div class="section"><div class="section-title">Confidence &amp; Analysis Notes</div>${mdToHtml(sections.CONFIDENCE)}</div>`
      : ""
  }

  <div class="disclaimer">
    Generated by PlainContracts on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
    This report is a translation and analysis tool only — it is not legal advice. Consult a qualified solicitor or attorney before making legal decisions.
  </div>

</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  openPrintWindow(html, "plaincontracts-analysis.html");
}

// ─── Export Generated Contract ────────────────────────────────────────────────

export function exportContractPDF(
  contractMarkdown: string,
  contractType: string,
  partyA: string,
  partyB: string
): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(contractType)} — PlainContracts</title>
  <style>
    ${PRINT_STYLES}
    body { font-family: 'Times New Roman', serif; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 13pt; text-align: left; }
    h3 { font-size: 11pt; }
    .contract-meta { text-align: center; font-size: 10pt; color: #555; margin-bottom: 32px; }
    .contract-body p { text-align: justify; }
  </style>
</head>
<body>
<div class="page">
  <div class="contract-body">
    ${mdToHtml(contractMarkdown)}
  </div>
  <div class="disclaimer">
    Generated by PlainContracts on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
    This is a draft document only. Review with qualified legal counsel before execution.
  </div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const safeType = contractType.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  openPrintWindow(html, `plaincontracts-${safeType || "contract"}.html`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens a print dialog using a hidden iframe — no popup window required.
 * This is the same technique used by Print.js and other cross-platform print
 * libraries. Works on Android Chrome, iOS Safari, and all desktop browsers
 * because it never calls window.open() (nothing to block).
 *
 * Fallback chain:
 *   1. Hidden iframe → iframe.contentWindow.print()   [primary, all platforms]
 *   2. Blob URL opened in new tab with print button   [if iframe init fails]
 *   3. Direct .html file download                     [if tab is also blocked]
 */
function openPrintWindow(html: string, filename = "plaincontracts-report.html"): void {
  // Strip the inline auto-print script — we call print() ourselves
  const cleanHtml = html.replace(
    "<script>window.onload = function() { window.print(); };</script>",
    ""
  );

  // ── Primary: hidden iframe (no popup blocking on any platform) ─────────────
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframe.contentDocument ?? iframeWin?.document;

  if (iframeDoc && iframeWin) {
    iframeDoc.open();
    iframeDoc.write(cleanHtml);
    iframeDoc.close();

    let triggered = false;
    const doPrint = () => {
      if (triggered) return;
      triggered = true;
      try {
        iframeWin.focus();
        iframeWin.print();
      } catch {
        // Shouldn't happen (same-origin), but fall through to blob fallback
        safeRemove(iframe);
        blobFallback(html, filename);
        return;
      }
      // Remove iframe after a long delay so the print dialog can finish
      setTimeout(() => safeRemove(iframe), 120_000);
    };

    if (iframeDoc.readyState === "complete") {
      // Already loaded (common for pure-HTML documents with no external assets)
      setTimeout(doPrint, 150);
    } else {
      iframe.onload = () => setTimeout(doPrint, 150);
      // Hard safety timeout — fires even if onload never triggers
      setTimeout(doPrint, 2_000);
    }
    return;
  }

  // iframe never initialised (extremely rare)
  safeRemove(iframe);
  blobFallback(html, filename);
}

function safeRemove(el: HTMLElement): void {
  try { el.parentNode?.removeChild(el); } catch { /* already removed */ }
}

/**
 * Fallback when the iframe approach fails.
 * On mobile: adds a visible "Save as PDF" button and opens blob in new tab.
 * On desktop: tries a new-tab blob URL, then falls back to file download.
 */
function blobFallback(html: string, filename: string): void {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const exportHtml = isMobile
    ? html.replace(
        "<script>window.onload = function() { window.print(); };</script>",
        `<div style="position:sticky;top:0;z-index:999;background:#1d4ed8;padding:14px 16px;text-align:center;">
           <button onclick="window.print()" style="background:#fff;color:#1d4ed8;border:none;border-radius:8px;padding:12px 0;font-size:16px;font-weight:700;cursor:pointer;width:100%;max-width:340px;display:block;margin:0 auto;">
             Save as PDF / Print
           </button>
           <p style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:8px;">
             Tap above, then choose &ldquo;Save as PDF&rdquo; from the menu
           </p>
         </div>`
      )
    : html;

  const blob = new Blob([exportHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, "_blank");
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  // Last resort: download the file directly
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
