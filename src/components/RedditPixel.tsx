"use client";

declare global {
  interface Window {
    rdt?: ((...args: unknown[]) => void) & { callQueue?: unknown[] };
  }
}

export function trackRedditEvent(event: "AddToCart" | "Purchase", properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.rdt) return;
  window.rdt("track", event, properties);
}
