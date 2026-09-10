import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events and keeps the Supabase `vip_users` table
 * in sync with subscription state.
 *
 * Required env vars (server-side, no NEXT_PUBLIC_ prefix):
 *   STRIPE_SECRET_KEY          — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET      — from `stripe listen` CLI or Stripe Dashboard
 *   SUPABASE_URL               — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase service role key (admin writes)
 */

// Next.js App Router: disable body parsing so we can read the raw buffer
// needed for Stripe webhook signature verification.
export const dynamic = "force-dynamic";

type VipStatus = "active" | "canceled" | "past_due" | "trialing";

/** Maps a Stripe subscription status to our internal VIP status. */
function toVipStatus(stripeStatus: Stripe.Subscription.Status): VipStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled";
  }
}

/** Extracts the Reddit username from the client_reference_id (format: `u_USERNAME`). */
function parseUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^u_(.+)$/);
  return match ? match[1] : null;
}

/** Upserts VIP data into Supabase. */
async function upsertVipUser(data: {
  redditUsername: string;
  status: VipStatus;
  plan: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
}) {
  const { error } = await getSupabaseAdmin().from("vip_users").upsert(
    {
      reddit_username: data.redditUsername,
      status: data.status,
      plan: data.plan,
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "reddit_username" }
  );

  if (error) {
    console.error("[webhook] Supabase upsert error:", error);
    throw error;
  }
}

/** Updates only the status of an existing VIP user (by subscription ID or username). */
async function updateVipStatus(params: {
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: VipStatus;
}) {
  let query = getSupabaseAdmin().from("vip_users").update({
    status: params.status,
    updated_at: new Date().toISOString(),
  });

  if (params.stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", params.stripeSubscriptionId);
  } else if (params.stripeCustomerId) {
    query = query.eq("stripe_customer_id", params.stripeCustomerId);
  } else {
    console.warn("[webhook] updateVipStatus called without an identifier");
    return;
  }

  const { error } = await query;
  if (error) {
    console.error("[webhook] Supabase update error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Read the raw body buffer — required for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // ── Payment completed via Payment Link or Checkout ──────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const username = parseUsername(session.client_reference_id);

        if (!username) {
          console.warn("[webhook] checkout.session.completed: no Reddit username in client_reference_id", {
            client_reference_id: session.client_reference_id,
          });
          break;
        }

        // Determine plan from metadata or amount
        const plan = session.metadata?.plan ?? (
          session.amount_total && session.amount_total >= 1900 ? "vip" : "essential"
        );

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? "";

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? undefined;

        await upsertVipUser({
          redditUsername: username,
          status: "active",
          plan,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });

        console.log(`[webhook] VIP activated: u/${username} (${plan})`);
        break;
      }

      // ── Subscription created (may arrive after checkout.session.completed) ──
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const status = toVipStatus(sub.status);
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status,
        });
        console.log(`[webhook] Subscription created: ${sub.id} → ${status}`);
        break;
      }

      // ── Subscription updated (renewal, plan change, etc.) ────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = toVipStatus(sub.status);
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status,
        });
        console.log(`[webhook] Subscription updated: ${sub.id} → ${status}`);
        break;
      }

      // ── Subscription cancelled ───────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status: "canceled",
        });
        console.log(`[webhook] Subscription cancelled: ${sub.id}`);
        break;
      }

      // ── Invoice paid (renewal) ───────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subRef === "string" ? subRef : subRef?.id;
        if (subscriptionId) {
          await updateVipStatus({
            stripeSubscriptionId: subscriptionId,
            status: "active",
          });
          console.log(`[webhook] Invoice paid, subscription active: ${subscriptionId}`);
        }
        break;
      }

      // ── Invoice payment failed ───────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subRef === "string" ? subRef : subRef?.id;
        if (subscriptionId) {
          await updateVipStatus({
            stripeSubscriptionId: subscriptionId,
            status: "past_due",
          });
          console.log(`[webhook] Invoice payment failed: ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Handler error:", message);
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
