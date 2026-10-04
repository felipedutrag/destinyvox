"use client";

declare global {
  interface Window {
    rdt?: ((...args: unknown[]) => void) & { callQueue?: unknown[] };
  }
}

export function trackRedditEvent(event: "AddToCart" | "Purchase", properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.rdt) return;
  // conversionId lets Reddit deduplicate the same conversion (e.g. polling + webhook, or pixel + Conversions API).
  const conversionId = properties.conversionId ?? properties.transactionId;
  window.rdt("track", event, conversionId ? { ...properties, conversionId: String(conversionId) } : properties);
}
