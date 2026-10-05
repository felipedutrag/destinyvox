import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase";
export const ANALYTICS_COOKIE = "dv_analytics_admin";
export const analyticsHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export function validPassword(value: string) {
  const secret = process.env.ANALYTICS_ADMIN_PASSWORD;
  return !!secret && secret.length >= 24 && timingSafeEqual(createHash("sha256").update(value).digest(), createHash("sha256").update(secret).digest());
}
export function adminToken(expiry: number) {
  return `${expiry}.${createHmac("sha256", process.env.ANALYTICS_ADMIN_PASSWORD || "").update(`analytics:${expiry}`).digest("hex")}`;
}
export async function isAnalyticsAdmin() {
  if ((process.env.ANALYTICS_ADMIN_PASSWORD?.length || 0) < 24) return false;
  const value = (await cookies()).get(ANALYTICS_COOKIE)?.value || "";
  const expiry = Number(value.split(".")[0]);
  if (!Number.isFinite(expiry) || expiry < Date.now() || expiry > Date.now() + 86400000) return false;
  const expected = adminToken(expiry);
  return Buffer.byteLength(value) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
export async function allowAnalytics(request: Request, scope: string, limit: number, seconds: number) {
  // Vercel overwrites this header. Configure a trusted proxy before self-hosting.
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const digest = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "analytics").update(ip).digest("hex");
  const { data, error } = await getSupabaseAdmin().rpc("analytics_allow", { p_key: `${scope}:${digest}`, p_limit: limit, p_seconds: seconds });
  if (error) throw error;
  return data === true;
}
