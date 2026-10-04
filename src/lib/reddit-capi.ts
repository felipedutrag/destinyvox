import { createHash } from "node:crypto";

const DEFAULT_PIXEL_ID = "a2_jo82q4y3vyus";

/** Attribution captured at checkout time (browser context is gone by the time the webhook arrives). */
export type RedditAttribution = {
  clickId?: string;
  uuid?: string;
  ipAddress?: string;
  userAgent?: string;
  sourceUrl?: string;
};

const clip = (value: string | null | undefined, max = 500) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

function readCookie(header: string | null, name: string) {
  const match = header?.split(/;\s*/).find(part => part.startsWith(`${name}=`));
  if (!match) return undefined;
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return undefined; }
}

/** Extracts Reddit match keys from the checkout request (cookies set by the pixel and by our layout script). */
export function getRedditAttribution(request: Request): RedditAttribution {
  const cookies = request.headers.get("cookie");
  // The pixel stores `_rdt_uuid` as "<timestamp>.<uuid>"; the API expects only the uuid part.
  const rawUuid = readCookie(cookies, "_rdt_uuid");
  const candidate = rawUuid?.includes(".") ? rawUuid.split(".").slice(1).join(".") : rawUuid;
  // Reddit rejects the entire event when the uuid is not RFC-4122.
  const uuid = candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate) ? candidate : undefined;
  const attribution: RedditAttribution = {
    clickId: clip(readCookie(cookies, "_rdt_cid")),
    uuid,
    ipAddress: clip(request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip"), 100),
    userAgent: clip(request.headers.get("user-agent")),
    sourceUrl: clip(request.headers.get("referer")),
  };
  return Object.fromEntries(Object.entries(attribution).filter(([, v]) => v)) as RedditAttribution;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Sends a server-side Purchase to Reddit. Never throws: tracking must not break payment processing.
 * `conversionId` must match the pixel's `conversionId` (the gateway transaction id) so Reddit deduplicates.
 */
export async function sendRedditPurchase(params: {
  conversionId: string;
  valueCents: number;
  currency?: string;
  email?: string | null;
  attribution?: RedditAttribution | null;
  eventAt?: string | number | null;
}) {
  const token = process.env.REDDIT_CAPI_TOKEN;
  if (!token) return;
  const pixelId = process.env.REDDIT_PIXEL_ID || DEFAULT_PIXEL_ID;
  const attribution = params.attribution || {};
  const email = params.email?.trim().toLowerCase();
  const parsedAt = params.eventAt ? new Date(params.eventAt).getTime() : NaN;
  // Reddit rejects events in the future or older than 7 days.
  const eventAt = Number.isFinite(parsedAt) && parsedAt <= Date.now() && Date.now() - parsedAt < 6 * 86400000 ? parsedAt : Date.now();

  const user: Record<string, string> = {};
  if (email) user.email = sha256(email);
  if (attribution.ipAddress) user.ip_address = attribution.ipAddress;
  if (attribution.userAgent) user.user_agent = attribution.userAgent;
  if (attribution.uuid) user.uuid = attribution.uuid;

  const event: Record<string, unknown> = {
    type: { tracking_type: "PURCHASE" },
    event_at: eventAt,
    action_source: "WEBSITE",
    metadata: {
      conversion_id: params.conversionId,
      currency: params.currency || "BRL",
      value: params.valueCents / 100,
      item_count: 1,
    },
    user,
  };
  if (attribution.clickId) event.click_id = attribution.clickId;
  if (attribution.sourceUrl) event.event_source_url = attribution.sourceUrl;

  const testId = process.env.REDDIT_CAPI_TEST_ID;
  try {
    const response = await fetch(`https://ads-api.reddit.com/api/v3/pixels/${encodeURIComponent(pixelId)}/conversion_events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { ...(testId ? { test_id: testId } : {}), events: [event] } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) console.error("[Reddit CAPI] Evento rejeitado", response.status, (await response.text()).slice(0, 500));
  } catch (error) {
    console.error("[Reddit CAPI] Falha ao enviar evento", error);
  }
}
