import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { name, email, birthDate, plan, orderBumps } = await request.json();

    if (!name || !email || !birthDate) {
      return NextResponse.json({ error: "Incomplete data" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const baseAmountCents = 1990; // $19.90 USD
    const karmicDebtCents = orderBumps?.karmicDebt ? 990 : 0; // $9.90 USD
    const personalYearMonthsCents = orderBumps?.personalYearMonths ? 990 : 0; // $9.90 USD

    const bumpsTag = `${orderBumps?.karmicDebt ? 'KD1' : 'KD0'}_${orderBumps?.personalYearMonths ? 'PY1' : 'PY0'}`;
    const external_id = `MAPA_${Date.now()}__||__${encodeURIComponent(name)}__||__${encodeURIComponent(email)}__||__${birthDate}__||__${plan || "mapa_completo"}__||__${bumpsTag}`;

    let description = "DestinyVox — Pythagorean Destiny Dossier (11 Pages PDF)";
    if (orderBumps?.karmicDebt && orderBumps?.personalYearMonths) {
      description += " + Karmic Debts + 2026 Month-by-Month Guide";
    } else if (orderBumps?.karmicDebt) {
      description += " + Karmic Debts Dossier";
    } else if (orderBumps?.personalYearMonths) {
      description += " + 2026 Month-by-Month Guide";
    }

    const stripe = getStripe();
    const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Pythagorean Destiny Dossier",
            description,
          },
          unit_amount: baseAmountCents + karmicDebtCents + personalYearMonthsCents,
        },
        quantity: 1,
      }
    ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      client_reference_id: external_id,
      customer_email: cleanEmail,
      metadata: {
        birthDate,
        name,
        email: cleanEmail,
        plan: plan || "mapa_completo",
        orderBumps: JSON.stringify(orderBumps || {}),
        karmicDebt: String(!!orderBumps?.karmicDebt),
        personalYearMonths: String(!!orderBumps?.personalYearMonths),
        external_id,
      },
      success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Persist payment as pending in Supabase
    try {
      const supabase = getSupabaseAdmin();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      await supabase.from("payments").insert({
        gateway: "stripe",
        external_id: external_id,
        transaction_id: session.id,
        user_id: profile?.id || null,
        payer_name: name,
        payer_email: cleanEmail,
        amount_cents: baseAmountCents + karmicDebtCents + personalYearMonthsCents,
        status: "PENDING",
        metadata: {
          birthDate,
          plan: plan || "mapa_completo",
          rawResponse: session,
        },
      });
      console.log(`[Supabase] Pending payment registered for ${email}`);
    } catch (dbErr) {
      console.error("[Supabase] Warning: Failed to register pending payment:", dbErr);
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      external_id: external_id
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
