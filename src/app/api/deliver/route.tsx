import { NextResponse } from "next/server";
import { deliverNumerologyMap } from "@/lib/delivery";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customerName = body.name || "Cliente";
    const customerEmail = body.email;
    const birthDateRaw = body.birthDate || "";

    if (!body.transaction_id && !body.external_id) {
      return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 });
    }

    const result = await deliverNumerologyMap({
      name: customerName,
      email: customerEmail || "",
      birthDate: birthDateRaw,
      transactionId: body.transaction_id,
      externalId: body.external_id,
      plan: body.plan,
    });

    return NextResponse.json({
      success: true,
      message: result.alreadyDelivered
        ? "Mapa já entregue anteriormente"
        : result.delivering ? "Preparando seu acesso" : "Link de acesso enviado por e-mail",
      delivering: !!result.delivering,
      email_sent: !!result.emailSent,
      already_delivered: !!result.alreadyDelivered,
    });
  } catch (error) {
    console.error("💥 Erro Fatal na Entrega:", error);
    return NextResponse.json(
      {
        error: "Erro interno no processamento do mapa",
      },
      { status: 500 }
    );
  }
}
