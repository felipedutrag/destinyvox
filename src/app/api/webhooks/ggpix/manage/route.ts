import { NextResponse } from "next/server";
import { ggpixClient, getGGPIXApiKey } from "@/lib/ggpix";

/**
 * GET /api/webhooks/ggpix/manage
 * Lista os webhooks atualmente cadastrados na GGPIX
 */
export async function GET() {
  const apiKey = getGGPIXApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GGPIX_KEY_FINAL não configurada no ambiente." },
      { status: 500 }
    );
  }

  try {
    const data = await ggpixClient.listWebhooks();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GGPIX Manage] Erro ao listar webhooks:", error);
    return NextResponse.json(
      { error: "Erro ao consultar webhooks na GGPIX", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/ggpix/manage
 * Cadastra o webhook do DestinyVox na GGPIX
 */
export async function POST(request: Request) {
  const apiKey = getGGPIXApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GGPIX_KEY_FINAL não configurada no ambiente." },
      { status: 500 }
    );
  }

  try {
    let body: { url?: string; label?: string; secret?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Usa padrão se corpo estiver vazio
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "https://destinyvox.online"
    ).replace(/\/$/, "");

    const targetUrl = body.url || `${appUrl}/api/webhooks/ggpix`;

    const registerResult = await ggpixClient.registerWebhook({
      url: targetUrl,
      label: body.label || "DestinyVox Webhook Principal",
      events: ["PIX_IN", "CARD_IN", "CARD_REFUND"],
      secret: body.secret || process.env.GGPIX_WEBHOOK_SECRET,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook cadastrado com sucesso na GGPIX!",
      data: registerResult,
    });
  } catch (error) {
    console.error("[GGPIX Manage] Erro ao registrar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar webhook na GGPIX", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/ggpix/manage?id=...
 * Remove um webhook cadastrado na GGPIX
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do webhook não informado." }, { status: 400 });
  }

  try {
    const res = await ggpixClient.deleteWebhook(id);
    return NextResponse.json({ success: true, message: "Webhook removido.", data: res });
  } catch (error) {
    console.error("[GGPIX Manage] Erro ao deletar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao remover webhook", details: String(error) },
      { status: 500 }
    );
  }
}
