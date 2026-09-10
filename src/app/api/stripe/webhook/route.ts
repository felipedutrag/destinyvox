import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events and keeps the Supabase `vip_users` table
 * in sync with credit balance and subscription state.
 *
 * Required env vars (server-side, no NEXT_PUBLIC_ prefix):
 *   STRIPE_SECRET_KEY          — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET      — from `stripe listen` CLI or Stripe Dashboard
 *   SUPABASE_URL               — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase service role key (admin writes)
 */

export const dynamic = "force-dynamic";

/** Maps a Stripe subscription status to a boolean active state. */
function toActiveStatus(stripeStatus: Stripe.Subscription.Status): boolean {
  return stripeStatus === "active" || stripeStatus === "trialing";
}

/** Extracts the Reddit username from client_reference_id or session metadata. */
function parseUsername(
  raw: string | null | undefined,
  metadata?: Stripe.Metadata | null
): string | null {
  if (metadata?.redditUsername) {
    return metadata.redditUsername.replace(/^u[\/_]/i, "").trim();
  }
  if (metadata?.reddit_username) {
    return metadata.reddit_username.replace(/^u[\/_]/i, "").trim();
  }
  if (!raw) return null;
  const match = raw.match(/^(?:u[\/_])?(.+)$/i);
  return match ? match[1].trim() : raw.trim();
}

/** Upserts VIP data directly into Supabase if RPC is unavailable. */
async function upsertVipUser(data: {
  redditUsername: string;
  status: boolean;
  plan: string;
  credits: number;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
}) {
  const { error } = await getSupabaseAdmin().from("vip_users").upsert(
    {
      reddit_username: data.redditUsername,
      status: data.status,
      plan: data.plan,
      credits: data.credits,
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

/** Updates the boolean status of an existing VIP user (by subscription ID or customer ID). */
async function updateVipStatus(params: {
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: boolean;
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
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
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

        // Skip unpaid sessions (e.g. delayed payments that haven't cleared yet)
        if (
          session.payment_status !== "paid" &&
          session.payment_status !== "no_payment_required"
        ) {
          console.warn(
            `[webhook] checkout.session.completed skipped: payment_status is '${session.payment_status}'`
          );
          break;
        }

        const username = parseUsername(
          session.client_reference_id,
          session.metadata
        );

        if (!username) {
          console.warn(
            "[webhook] checkout.session.completed: no Reddit username found",
            {
              client_reference_id: session.client_reference_id,
              metadata: session.metadata,
            }
          );
          break;
        }

        // Determine plan and credits
        let credits = 10;
        if (session.metadata?.credits) {
          credits = parseInt(session.metadata.credits, 10) || 10;
        } else if (
          session.metadata?.plan === "30_questions" ||
          session.metadata?.plan === "vip" ||
          (session.amount_total && session.amount_total >= 1900)
        ) {
          credits = 30;
        }

        const plan =
          session.metadata?.plan ??
          (credits === 30 ? "30_questions" : "10_questions");

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? "";

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? undefined;

        // Use PostgreSQL stored function for atomic credit addition
        const { error: rpcError } = await getSupabaseAdmin().rpc(
          "add_user_credits",
          {
            p_reddit_username: username,
            p_credits: credits,
            p_plan: plan,
            p_stripe_customer_id: customerId || null,
            p_stripe_subscription_id: subscriptionId || null,
          }
        );

        if (rpcError) {
          console.warn(
            "[webhook] RPC add_user_credits failed, falling back to upsert:",
            rpcError
          );
          await upsertVipUser({
            redditUsername: username,
            status: true,
            plan,
            credits,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        }

        console.log(
          `[webhook] User u/${username} credited +${credits} questions (${plan}, status=true)`
        );
        break;
      }

      // ── Subscription created ─────────────────────────────────────────────
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const status = toActiveStatus(sub.status);
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status,
        });
        console.log(`[webhook] Subscription created: ${sub.id} → status=${status}`);
        break;
      }

      // ── Subscription updated ─────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = toActiveStatus(sub.status);
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status,
        });
        console.log(`[webhook] Subscription updated: ${sub.id} → status=${status}`);
        break;
      }

      // ── Subscription cancelled ───────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status: false,
        });
        console.log(`[webhook] Subscription cancelled: ${sub.id} → status=false`);
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
            status: true,
          });
          console.log(`[webhook] Invoice paid: ${subscriptionId} → status=true`);
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
            status: false,
          });
          console.log(`[webhook] Invoice payment failed: ${subscriptionId} → status=false`);
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
