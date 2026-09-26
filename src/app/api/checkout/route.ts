import { after, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramCheckoutInitiated } from "@/lib/telegram";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { name, email, birthDate, plan = "complete_numerology_reading" } = await request.json();
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100 || typeof email !== "string" || !email.includes("@") || typeof birthDate !== "string") {
      return NextResponse.json({ error: "Incomplete data" }, { status: 400 });
    }
    const date = new Date(`${birthDate}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate || date > new Date()) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const totalCents = 2700;
    const external_id = `MAPA_${Date.now()}__||__${encodeURIComponent(cleanName)}__||__${encodeURIComponent(cleanEmail)}__||__${birthDate}__||__${plan}__||__KD0_PY0`;
    const stripe = getStripe();
    const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Complete Personal Numerology Reading",
          description: "A personalized 8-number profile with full interpretations, relationship and work insights, challenges and growth, and guidance for your current personal year. Includes online access and a downloadable PDF.",
        },
        unit_amount: totalCents,
      },
      quantity: 1,
    }];

    const session = await stripe.checkout.sessions.create({
      adaptive_pricing: { enabled: true },
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      locale: "auto",
      client_reference_id: external_id,
      customer_email: cleanEmail,
      metadata: { birthDate, name: cleanName, email: cleanEmail, plan, orderBumps: "{}", external_id },
      success_url: `${origin}/reading?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    console.info(`[Stripe Checkout] Session created; mode=${session.livemode ? "live" : "test"}, adaptivePricing=${session.adaptive_pricing?.enabled ?? "unknown"}, currency=${session.currency}`);

    after(async () => {
      const sideEffects = await Promise.allSettled([
        (async () => {
          const supabase = getSupabaseAdmin();
          const { error } = await supabase.from("payments").insert({
            gateway: "stripe", external_id, transaction_id: session.id, user_id: null,
            payer_name: cleanName, payer_email: cleanEmail, amount_cents: totalCents, status: "PENDING",
            metadata: { birthDate, plan, rawResponse: session },
          });
          if (error) throw error;
        })(),
        sendTelegramCheckoutInitiated({ payerName: cleanName, payerEmail: cleanEmail, amountCents: totalCents, plan, orderBumps: { karmicDebt: false, personalYearMonths: false } }),
      ]);

      for (const result of sideEffects) {
        if (result.status === "rejected") console.error("[Checkout] Background follow-up failed:", result.reason);
      }
    });

    return NextResponse.json({ success: true, url: session.url, external_id });
  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
