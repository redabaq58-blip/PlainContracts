import { useState, useEffect } from "react";

/**
 * Pings /api/health until the server responds, then returns ready=true.
 * This guarantees Railway has fully woken from cold-start before the user
 * can trigger any API request.
 *
 * - Polls every 2s, up to 12 attempts (~24s total)
 * - After the timeout, sets ready=true anyway so the UI doesn't stay
 *   blocked forever on bad networks
 */
export function useServerReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      for (let i = 0; i < 12; i++) {
        try {
          const res = await fetch("/api/health", { cache: "no-store" });
          if (res.ok) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // server still sleeping
        }
        if (cancelled) return;
        // exponential back-off: 1s, 2s, 2s, 2s, 2s …
        await new Promise((r) => setTimeout(r, i === 0 ? 1000 : 2000));
      }
      // Give up waiting — let the user try; retry logic on each request handles it
      if (!cancelled) setReady(true);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
