// Reads only webhook configuration; --test sends GGPIX's documented test event.
// Never prints keys, tokens, customer information, or full gateway responses.
const key = (process.env.GGPIX_KEY_FINAL || process.env.GGPIX_API_KEY || "").trim().replace(/^["'](.+)["']$/, "$1");
if (!key) throw new Error("GGPIX key is not configured");
const base = "https://ggpixapi.com/api/v1";
const expected = new URL("/api/webhooks/ggpix", process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://destinyvox.online").href;
console.log(JSON.stringify({ configured: { apiKey: !!key, hmac: !!(process.env.GGPIX_WEBHOOK_SECRET || process.env.GGPIX_HMAC_SECRET), bearer: !!(process.env.GGPIX_WEBHOOK_TOKEN || process.env.GGPIX_BEARER_TOKEN) }, expectedWebhook: expected }));
const response = await fetch(`${base}/webhooks`, { headers: { "X-API-Key": key }, signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`GGPIX list HTTP ${response.status}`);
const data = await response.json();
const hooks = data.webhooks || [];
console.log(JSON.stringify({ webhooks: hooks.map(h => ({ id: h.id, url: h.url, active: h.active, events: h.events, authType: h.authType, lastSuccessAt: h.lastSuccessAt, lastFailureAt: h.lastFailureAt, consecutiveFailures: h.consecutiveFailures })) }, null, 2));
if (process.argv.includes("--test")) {
  const appEndpoint = value => { const url = new URL(value); return `${url.protocol}//${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`; };
  const matches = hooks.filter(h => appEndpoint(h.url) === appEndpoint(expected) && h.active);
  if (matches.length !== 1) throw new Error("Expected exactly one active webhook for this app");
  const testResponse = await fetch(`${base}/webhooks/${encodeURIComponent(matches[0].id)}/test`, { method: "POST", headers: { "X-API-Key": key }, signal: AbortSignal.timeout(30000) });
  const result = await testResponse.json();
  console.log(JSON.stringify({ test: { httpStatus: testResponse.status, keys: Object.keys(result), success: result.success, error: result.error, message: result.message, responseStatus: result.responseStatus, responseBody: typeof result.responseBody === "string" && result.responseBody.length < 200 ? result.responseBody : undefined } }, null, 2));
  if (!testResponse.ok || result.success === false) process.exitCode = 1;
}
