// Preload ONLY in the isolated localhost QA server. Payment/email calls cannot
// leave this process; Supabase is used only for uniquely named disposable rows.
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
if (!process.env.PAYMENT_QA_STATE) throw new Error("PAYMENT_QA_STATE required");
const originalFetch = global.fetch;
const statePath = process.env.PAYMENT_QA_STATE;
const read = () => JSON.parse(fs.readFileSync(statePath, "utf8"));
const save = value => fs.writeFileSync(statePath, JSON.stringify(value));
global.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.url || input.href);
  const method = (init?.method || input.method || "GET").toUpperCase();
  if (url.hostname === "ggpixapi.com") {
    const state = read();
    if (url.pathname === "/api/v1/pix/in" && method === "POST") {
      const body = JSON.parse(init.body);
      if (body.customerEmail !== state.email) throw new Error("QA refuses non-fixture customers");
      const id = `qa_${randomUUID()}`;
      state.transactions[id] = { amount: body.amountCents, status: "PENDING", externalId: body.externalId, polls: 0, autoPay: state.autoPay };
      save(state);
      return Response.json({ id, pixCode: `QA-NOT-A-REAL-PIX-${id}` });
    }
    if (url.pathname.startsWith("/api/v1/transactions/") && method === "GET") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const row = state.transactions[id];
      if (!row) return Response.json({ error: "QA transaction not found" }, { status: 404 });
      row.polls++;
      if (row.autoPay && row.polls >= 3) row.status = "COMPLETE";
      save(state);
      if (row.networkError) return Response.json({ error: "QA transient outage" }, { status: 503 });
      return Response.json({ id, status: row.status, ...(row.omitAmount ? {} : { amount: row.amount }), externalId: row.externalId });
    }
    throw new Error("QA blocks all other gateway operations");
  }
  if (url.hostname === "api.resend.com") {
    const state = read();
    const body = JSON.parse(init.body);
    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    if (recipients.some(to => to !== state.email)) throw new Error("QA refuses non-fixture recipients");
    if (state.failEmail) return Response.json({ name: "application_error", message: "QA temporary delivery failure" }, { status: 503 });
    state.emails.push({ subject: body.subject, to: recipients });
    save(state);
    return Response.json({ id: `qa-email-${randomUUID()}` });
  }
  if (url.hostname === "api.telegram.org") return Response.json({ ok: true });
  const supabaseHost = new URL(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  if (url.hostname === supabaseHost || ["localhost", "127.0.0.1"].includes(url.hostname)) return originalFetch(input, init);
  throw new Error(`QA blocked outgoing request to ${url.hostname}`);
};
