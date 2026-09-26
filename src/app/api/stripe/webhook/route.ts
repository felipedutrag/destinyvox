import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deliverNumerologyMap } from "@/lib/delivery";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const externalId = session.client_reference_id;
    const metadata = session.metadata;

    if (externalId && externalId.startsWith("MAPA_")) {
      console.log(`[Stripe Webhook] Processing successful payment for ${externalId}`);
      
      const email = metadata?.email || session.customer_email;
      const name = metadata?.name;
      const birthDate = metadata?.birthDate;
      const plan = metadata?.plan || "mapa_completo";
      const orderBumps = metadata?.orderBumps ? JSON.parse(metadata.orderBumps) : {};

      // 1. Upsert the payment before delivery. The checkout-side background insert
      // can fail or race with this webhook, so the webhook must be self-sufficient.
      try {
        const { error: paymentError } = await supabase
          .from("payments")
          .upsert({
            gateway: "stripe",
            external_id: externalId,
            transaction_id: session.id,
            payer_name: name || session.customer_details?.name || "Customer",
            payer_email: email || "",
            amount_cents: session.amount_total ?? 2700,
            status: "PAID",
            paid_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              stripe_currency: session.currency,
              stripe_amount_total: session.amount_total,
            },
          }, { onConflict: "external_id" });
        if (paymentError) throw paymentError;
        console.log(`[Stripe Webhook] Payment ${externalId} marked as PAID`);
      } catch (dbErr) {
        console.error(`[Stripe Webhook] Error updating payment ${externalId}:`, dbErr);
        return NextResponse.json({ error: "Could not record the confirmed payment" }, { status: 500 });
      }

      // 2. Deliver the PDF Map
      if (email && name && birthDate) {
        try {
          await deliverNumerologyMap({
            name,
            email,
            birthDate,
            transactionId: session.id,
            externalId: externalId,
            amountCents: session.amount_total || 2700,
            currency: session.currency || "usd",
            plan,
            orderBumps,
          });
          console.log(`[Stripe Webhook] Successfully delivered map to ${email}`);
        } catch (deliveryErr) {
          console.error(`[Stripe Webhook] Error delivering map to ${email}:`, deliveryErr);
          try {
            await supabase
              .from("payments")
              .update({
                metadata: {
                  ...metadata,
                  delivering: false,
                  delivery_failed_at: new Date().toISOString(),
                },
              })
              .eq("transaction_id", session.id);
          } catch (unlockErr) {
            console.error(`[Stripe Webhook] Could not release delivery lock for ${session.id}:`, unlockErr);
          }
          return NextResponse.json({ error: "Payment received, but reading delivery failed" }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
