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
  console.log("[webhook] 🚀 Executando fulfillPayment no Supabase:", {
    paymentId: params.paymentId,
    redditUsername: params.redditUsername,
    credits: params.credits,
    plan: params.plan,
  });

  const { data, error } = await getSupabaseAdmin().rpc("process_stripe_payment", {
    p_payment_id: params.paymentId,
    p_reddit_username: params.redditUsername,
    p_credits: params.credits,
    p_plan: params.plan,
    p_stripe_customer_id: params.customerId || null,
    p_stripe_subscription_id: params.subscriptionId || null,
  });

  if (error) {
    console.error(
      "[webhook] ⚠️ RPC process_stripe_payment retornou erro:",
      error
    );
    console.log("[webhook] Tentando fallback com add_user_credits direto...");
    const { error: directError } = await getSupabaseAdmin().rpc("add_user_credits", {
      p_reddit_username: params.redditUsername,
      p_credits: params.credits,
      p_plan: params.plan,
      p_stripe_customer_id: params.customerId || null,
      p_stripe_subscription_id: params.subscriptionId || null,
    });
    if (directError) {
      console.error("[webhook] ❌ Fallback direto também falhou:", directError);
      throw directError;
    } else {
      console.log("[webhook]  Fallback direto funcionou com sucesso!");
    }
  } else {
    const result = data as { already_processed?: boolean; message?: string } | null;
    if (result?.already_processed) {
      console.log(
        `[webhook] ℹ️ Pagamento ${params.paymentId} já havia sido processado anteriormente. Ignorando para evitar duplicidade.`
      );
    } else {
      console.log(
        `[webhook] ✅ Sucesso! Pagamento ${params.paymentId} processado (+${params.credits} créditos) para u/${params.redditUsername}:`,
        data
      );
    }
  }
}

/** Updates the boolean status of an existing VIP user (by subscription ID or customer ID). */
async function updateVipStatus(params: {
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: boolean;
}) {
  console.log("[webhook] Atualizando status de assinatura:", params);
  let query = getSupabaseAdmin().from("vip_users").update({
    status: params.status,
    updated_at: new Date().toISOString(),
  });

  if (params.stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", params.stripeSubscriptionId);
  } else if (params.stripeCustomerId) {
    query = query.eq("stripe_customer_id", params.stripeCustomerId);
  } else {
    console.warn("[webhook] ⚠️ updateVipStatus chamado sem identificador");
    return;
  }

  const { error } = await query;
  if (error) {
    console.error("[webhook] ❌ Erro ao atualizar status no Supabase:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  console.log("\n[webhook] ==================== NOVO EVENTO RECEBIDO ====================");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] ❌ STRIPE_WEBHOOK_SECRET NÃO CONFIGURADO nas variáveis de ambiente da Vercel!");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const maskedSecret = webhookSecret.slice(0, 8) + "..." + webhookSecret.slice(-4);
  console.log(`[webhook] Usando STRIPE_WEBHOOK_SECRET: ${maskedSecret}`);

  // Read the raw body buffer — required for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhook] ❌ Header 'stripe-signature' ausente na requisição!");
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
    console.error("[webhook] ❌ FALHA NA VERIFICAÇÃO DA ASSINATURA STRIPE:", message);
    console.error("[webhook] DICA: Verifique se o Signing Secret no Stripe Dashboard começa com whsec_ e bate com a Vercel.");
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[webhook]  Assinatura verificada! Tipo de evento: ${event.type} (ID: ${event.id})`);

  try {
    switch (event.type) {
      // ── Checkout Session Completed ───────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[webhook] Analisando checkout.session.completed:", {
          id: session.id,
          payment_status: session.payment_status,
          client_reference_id: session.client_reference_id,
          metadata: session.metadata,
        });

        if (
          session.payment_status !== "paid" &&
          session.payment_status !== "no_payment_required"
        ) {
          console.warn(
            `[webhook] ⚠️ checkout.session.completed ignorado: payment_status é '${session.payment_status}' (não pago)`
          );
          break;
        }

        const username = parseUsername(
          session.client_reference_id,
          session.metadata
        );

        if (!username) {
          console.warn(
            "[webhook] ⚠️ checkout.session.completed: nenhum usuário do Reddit encontrado!",
            { client_reference_id: session.client_reference_id, metadata: session.metadata }
          );
          break;
        }

        const credits = parseCredits(session.metadata, session.amount_total);
        const plan =
          session.metadata?.plan ?? (credits === 30 ? "30_questions" : "10_questions");

        // Preferir o payment_intent se existir, senão usa session.id
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
        // checkout.session.completed é o evento canônico para compras via checkout.
        // O payment_intent.succeeded é disparado simultaneamente para a mesma transação.
        // Se o checkout já processou (ou vai processar), ignoramos aqui para evitar duplicidade.
        console.log("[webhook] ℹ️ payment_intent.succeeded recebido (gerenciado via checkout.session.completed)");
        break;
      }

      // ── Charge Succeeded / Updated ───────────────────────────────────────
      case "charge.succeeded":
      case "charge.updated": {
        // Charge events são filhos de PaymentIntent/Checkout. Ignorados para prevenir duplicidade de créditos.
        console.log(`[webhook] ℹ️ ${event.type} recebido (gerenciado via checkout.session.completed)`);
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
        console.log(`[webhook] Assinatura ${sub.id} → status=${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateVipStatus({
          stripeSubscriptionId: sub.id,
          status: false,
        });
        console.log(`[webhook] Assinatura cancelada: ${sub.id} → status=false`);
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
          console.log(`[webhook] Fatura paga: ${subscriptionId} → status=true`);
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
          console.log(`[webhook] Falha no pagamento da fatura: ${subscriptionId} → status=false`);
        }
        break;
      }

      default:
        console.log(`[webhook] ℹ️ Evento não monitorado ignorado: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] ❌ Erro interno no handler do evento:", message);
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  console.log("[webhook] ==================== EVENTO FINALIZADO COM SUCESSO ====================\n");
  return NextResponse.json({ received: true });
}
