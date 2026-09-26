import { trackRedditEvent } from "@/lib/redditPixel";

export type NumerologyFunnelEvent =
  | "numerology_started"
  | "birth_data_submitted"
  | "numerology_result_received"
  | "reading_preview_viewed"
  | "offer_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "full_reading_opened"
  | "pdf_downloaded"
  | "funnel_transition";

export function trackFunnelEvent(
  eventName: NumerologyFunnelEvent,
  properties: Record<string, string | number | boolean> = {},
) {
  trackRedditEvent("Custom", { customEventName: eventName, ...properties });
}

export function trackFunnelTransition(from: string, to: string) {
  trackFunnelEvent("funnel_transition", { from_stage: from, to_stage: to });
}
