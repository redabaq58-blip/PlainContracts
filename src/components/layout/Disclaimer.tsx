"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export function Disclaimer() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
      <div className="container max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
          <strong>Not legal advice.</strong> PlainContracts translates contracts
          into plain language for your understanding. Always consult a qualified
          attorney before signing any legal document.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:opacity-70 transition-opacity ml-2"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
