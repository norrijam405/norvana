"use client";

import { useEffect } from "react";

export function WatchtowerPwaRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/watchtower-sw.js", { scope: "/" }).catch(() => {
      // Keep Watchtower usable even when service workers are unavailable.
    });
  }, []);

  return null;
}
