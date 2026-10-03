import { NextResponse } from "next/server";
import { deliverNumerologyMap } from "@/lib/delivery";

export async function POST(request: Request) {
  console.log("🔔 Pedido de entrega recebido via /api/deliver");
  try {
    const body = await request.json();
    console.log("Payload de entrega:", JSON.stringify(body));

    const customerName = body.name || "Cliente";
    const customerEmail = body.email;
    const birthDateRaw = body.birthDate || "";

    if (!customerEmail) {
      return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });
    }

    const result = await deliverNumerologyMap({
      name: customerName,
      email: customerEmail,
      birthDate: birthDateRaw,
      transactionId: body.transaction_id,
      externalId: body.external_id,
      plan: body.plan,
    });

    return NextResponse.json({
      success: true,
      message: result.alreadyDelivered
        ? "Mapa já entregue anteriormente"
        : "PDF gerado, salvo no Supabase e enviado com sucesso",
      map_id: result.mapId,
      already_delivered: !!result.alreadyDelivered,
    });
  } catch (error) {
    console.error("💥 Erro Fatal na Entrega:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro interno no processamento do mapa",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
