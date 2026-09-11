import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events (checkout.session.completed, payment_intent.succeeded,
 * charge.succeeded, charge.updated, and subscription lifecycle) and keeps the Supabase
 * `vip_users` table in sync with credit balance and status.
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

/** Determines credits count from metadata or amount. */
function parseCredits(metadata?: Stripe.Metadata | null, amountTotal?: number | null): number {
  if (metadata?.credits) {
    const parsed = parseInt(metadata.credits, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (
    metadata?.plan === "30_questions" ||
    metadata?.plan === "vip" ||
    (amountTotal && amountTotal >= 1900)
  ) {
    return 30;
  }
  return 10;
}

/**
 * Invokes the idempotent process_stripe_payment function in Supabase.
 * Prevents double-crediting even if multiple events (e.g. charge.succeeded and
 * checkout.session.completed) arrive for the same payment.
 */
async function fulfillPayment(params: {
  paymentId: string;
  redditUsername: string;
  credits: number;
  plan: string;
  customerId?: string;
  subscriptionId?: string;
}) {
  const { data, error } = await getSupabaseAdmin().rpc("process_stripe_payment", {
    p_payment_id: params.paymentId,
    p_reddit_username: params.redditUsername,
    p_credits: params.credits,
    p_plan: params.plan,
    p_stripe_customer_id: params.customerId || null,
    p_stripe_subscription_id: params.subscriptionId || null,
  });

  if (error) {
    console.warn(
      "[webhook] RPC process_stripe_payment failed, calling add_user_credits directly:",
      error
    );
    await getSupabaseAdmin().rpc("add_user_credits", {
      p_reddit_username: params.redditUsername,
      p_credits: params.credits,
      p_plan: params.plan,
      p_stripe_customer_id: params.customerId || null,
      p_stripe_subscription_id: params.subscriptionId || null,
    });
  } else {
    console.log(
      `[webhook] Processed payment ${params.paymentId} for u/${params.redditUsername}:`,
      data
    );
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
      // ── Checkout Session Completed ───────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

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
            { client_reference_id: session.client_reference_id, metadata: session.metadata }
          );
          break;
        }

        const credits = parseCredits(session.metadata, session.amount_total);
        const plan =
          session.metadata?.plan ?? (credits === 30 ? "30_questions" : "10_questions");

        const paymentId =
          (typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id) || session.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? "";

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? undefined;

        await fulfillPayment({
          paymentId,
          redditUsername: username,
          credits,
          plan,
          customerId,
          subscriptionId,
        });
        break;
      }

      // ── Payment Intent Succeeded ─────────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const username = parseUsername(null, pi.metadata);

        if (!username) {
          console.log("[webhook] payment_intent.succeeded: no username in metadata, skipping");
          break;
        }

        const credits = parseCredits(pi.metadata, pi.amount);
        const plan =
          pi.metadata?.plan ?? (credits === 30 ? "30_questions" : "10_questions");

        const customerId =
          typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? "";

        await fulfillPayment({
          paymentId: pi.id,
          redditUsername: username,
          credits,
          plan,
          customerId,
        });
        break;
      }

      // ── Charge Succeeded / Updated ───────────────────────────────────────
      case "charge.succeeded":
      case "charge.updated": {
        const charge = event.data.object as Stripe.Charge;

        if (!charge.paid || charge.status !== "succeeded") {
          console.log(`[webhook] ${event.type} ignored: paid=${charge.paid}, status=${charge.status}`);
          break;
        }

        const username = parseUsername(null, charge.metadata);
        if (!username) {
          console.log(`[webhook] ${event.type}: no username in metadata, skipping`);
          break;
        }

        const credits = parseCredits(charge.metadata, charge.amount);
        const plan =
          charge.metadata?.plan ?? (credits === 30 ? "30_questions" : "10_questions");

        const paymentId =
          (typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id) || charge.id;

        const customerId =
          typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? "";

        await fulfillPayment({
          paymentId,
          redditUsername: username,
          credits,
          plan,
          customerId,
        });
        break;
      }

      // ── Subscription lifecycle events ────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = toActiveStatus(sub.status);
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status,
        });
        console.log(`[webhook] Subscription ${sub.id} → status=${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status: false,
        });
        console.log(`[webhook] Subscription cancelled: ${sub.id} → status=false`);
        break;
      }

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
