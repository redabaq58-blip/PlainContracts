"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

/**
 * Detects common in-app browsers (WhatsApp, Instagram, Facebook, Android
 * WebView) and shows a banner prompting the user to open in Chrome.
 * These browsers have restrictions that break file uploads and fetch requests.
 */
function detectInAppBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;

  if (/WhatsApp/i.test(ua)) return "WhatsApp";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/\bwv\b/.test(ua) && /Android/i.test(ua)) return "this app";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/Line\//i.test(ua)) return "Line";

  return null;
}

export function InAppBrowserBanner() {
  const [appName, setAppName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setAppName(detectInAppBrowser());
  }, []);

  if (!appName || dismissed) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800">
      <div className="container max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-300 flex-1">
          <strong>Open in Chrome for full functionality.</strong>{" "}
          {appName}&apos;s built-in browser blocks file uploads and downloads.
          Tap <strong>⋮ → Open in Chrome</strong> (or copy the link and paste it in Chrome).
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-600 dark:text-blue-400 hover:opacity-70 transition-opacity ml-2 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
