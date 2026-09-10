import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export type PlanType = "10_questions" | "30_questions" | "essential" | "vip";

interface CheckoutRequestBody {
  plan: PlanType;
  redditUsername: string;
  locale?: "en" | "pt" | "es";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const { plan, redditUsername, locale = "en" } = body;

    // Normalize legacy plans if any
    let normalizedPlan: "10_questions" | "30_questions";
    let credits: number;

    if (plan === "10_questions" || plan === "essential") {
      normalizedPlan = "10_questions";
      credits = 10;
    } else if (plan === "30_questions" || plan === "vip") {
      normalizedPlan = "30_questions";
      credits = 30;
    } else {
      return NextResponse.json(
        { error: "Invalid plan. Must be '10_questions' or '30_questions'." },
        { status: 400 }
      );
    }

    // Validate and sanitize Reddit username
    const cleanUsername = redditUsername
      ? redditUsername.replace(/^u[\/_]/i, "").trim()
      : "";

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Reddit username is required to activate your access." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Determine cancel URL from origin or env var (sanitize trailing slash)
    const rawOrigin =
      req.headers.get("origin") ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const origin = rawOrigin.replace(/\/+$/, "");
    const cancelUrl = `${origin}/#pricing`;

    // Success URL redirects directly to the DestinyVox subreddit as requested
    const successUrl =
      "https://www.reddit.com/r/DestinyVox/?session_id={CHECKOUT_SESSION_ID}&status=success";

    // Map UI locale to Stripe supported locale
    const stripeLocale: Stripe.Checkout.SessionCreateParams.Locale =
      locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en";

    // Check if custom Price IDs are configured in environment variables
    const priceId =
      normalizedPlan === "30_questions"
        ? process.env.STRIPE_PRICE_ID_30 || process.env.STRIPE_PRICE_ID_VIP
        : process.env.STRIPE_PRICE_ID_10 || process.env.STRIPE_PRICE_ID_ESSENTIAL;

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (priceId) {
      lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else {
      // Dynamic price details: $9 for 10 questions, $19 for 30 questions
      const planDetails = {
        "10_questions": {
          name: "DestinyVox Oracle — 10 Perguntas / Questions",
          description:
            "Pacote com 10 consultas completas com o Oráculo DestinyVox no Reddit",
          amount: 900, // $9.00 USD
        },
        "30_questions": {
          name: "DestinyVox Oracle — 30 Perguntas / Questions",
          description:
            "Pacote com 30 consultas completas com o Oráculo DestinyVox no Reddit",
          amount: 1900, // $19.00 USD
        },
      }[normalizedPlan];

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planDetails.name,
              description: planDetails.description,
            },
            unit_amount: planDetails.amount,
          },
          quantity: 1,
        },
      ];
    }

    const metadata = {
      redditUsername: cleanUsername,
      plan: normalizedPlan,
      credits: String(credits),
      platform: "destinyvox_landing",
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      client_reference_id: `u_${cleanUsername}`,
      metadata,
      payment_intent_data: {
        metadata,
      },
      locale: stripeLocale,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to generate Stripe checkout session URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Error creating checkout session:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
