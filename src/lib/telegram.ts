const DEFAULT_BOT_TOKEN = "8772913024:AAHCsGyYaf11MkncGCHSwj-q8OJVYzQ6v8c";
const DEFAULT_CHAT_ID = "8024902234";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatBrasiliaDate(date: Date = new Date()): string {
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function sendTelegramMessage(text: string, contextDesc: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(`[telegram] Credenciais não encontradas. Alerta (${contextDesc}) ignorado.`);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[telegram] Erro ao enviar alerta (${contextDesc}):`, errorText);
      return false;
    }
    console.log(`[telegram] ✅ Alerta (${contextDesc}) enviado ao Telegram com sucesso.`);
    return true;
  } catch (error) {
    console.error(`[telegram] Falha ao despachar alerta (${contextDesc}):`, error);
    return false;
  }
}

export type TelegramPaymentAlertParams = {
  redditUsername: string;
  plan: string;
  credits: number;
  amount: number;
  currency: string;
  paymentId: string;
  customerEmail?: string | null;
};

/**
 * Sends a real-time Telegram notification when a Stripe payment is completed.
 */
export async function sendTelegramPaymentAlert(
  params: TelegramPaymentAlertParams
): Promise<void> {
  const lines = [
    `💰 <b>PAGAMENTO STRIPE APROVADO!</b> 💳`,
    ``,
    `👤 <b>Usuário Reddit:</b> <code>u/${escapeHtml(params.redditUsername)}</code>`,
    `📦 <b>Plano:</b> <code>${escapeHtml(params.plan)}</code>`,
    `🔮 <b>Créditos Adicionados:</b> <b>+${params.credits}</b> perguntas`,
    `💵 <b>Valor:</b> ${params.currency.toUpperCase()} $${params.amount.toFixed(2)}`,
    params.customerEmail ? `📧 <b>E-mail:</b> <code>${escapeHtml(params.customerEmail)}</code>` : null,
    `🆔 <b>ID Transação:</b> <code>${escapeHtml(params.paymentId)}</code>`,
    `⏰ <b>Data/Hora:</b> ${formatBrasiliaDate()}`,
    ``,
    `✨ <i>DestinyVox VIP Portal</i>`,
  ].filter((line): line is string => line !== null);

  await sendTelegramMessage(lines.join("\n"), "Stripe aprovado");
}

export type TelegramPixCreatedAlertParams = {
  payerName: string;
  payerEmail: string;
  amountCents: number;
  transactionId: string;
  externalId?: string;
  product?: string;
  bumps?: string[];
  crushName?: string;
};

/**
 * Envia notificação em tempo real no Telegram quando um QR Code / Pix for gerado no checkout.
 */
export async function sendTelegramPixCreatedAlert(
  params: TelegramPixCreatedAlertParams
): Promise<void> {
  const valorFormatado = formatBrl(params.amountCents);
  const bumpsText = params.bumps && params.bumps.length > 0 ? params.bumps.map(escapeHtml).join(", ") : null;

  const lines = [
    `📱 <b>NOVO PIX / QR CODE GERADO!</b> ⚡`,
    ``,
    `👤 <b>Cliente:</b> <code>${escapeHtml(params.payerName)}</code>`,
    `📧 <b>E-mail:</b> <code>${escapeHtml(params.payerEmail)}</code>`,
    `💵 <b>Valor:</b> <b>${valorFormatado}</b>`,
    params.product ? `📦 <b>Produto:</b> <code>${escapeHtml(params.product)}</code>` : null,
    bumpsText ? `✨ <b>Adicionais:</b> <code>${bumpsText}</code>` : null,
    params.crushName ? `💞 <b>Crush (Sinastria):</b> <code>${escapeHtml(params.crushName)}</code>` : null,
    `🆔 <b>ID Transação:</b> <code>${escapeHtml(params.transactionId)}</code>`,
    params.externalId ? `🔖 <b>ID Externo:</b> <code>${escapeHtml(params.externalId)}</code>` : null,
    `⏰ <b>Horário:</b> ${formatBrasiliaDate()}`,
    ``,
    `⏳ <i>Aguardando pagamento pelo cliente...</i>`,
  ].filter((line): line is string => line !== null);

  await sendTelegramMessage(lines.join("\n"), "QR Code Pix gerado");
}

export type TelegramPixAlertParams = {
  payerName: string;
  payerEmail: string;
  amountCents: number;
  transactionId: string;
  externalId?: string;
  plan?: string;
  bumps?: string[];
  crushName?: string;
};

/**
 * Envia notificação em tempo real no Telegram quando um PIX da GGPIX for aprovado.
 */
export async function sendTelegramPixNotification(
  params: TelegramPixAlertParams
): Promise<void> {
  const valorFormatado = formatBrl(params.amountCents);
  const bumpsText = params.bumps && params.bumps.length > 0 ? params.bumps.map(escapeHtml).join(", ") : null;

  const lines = [
    `💚 <b>PAGAMENTO PIX CONFIRMADO!</b> ⚡`,
    ``,
    `👤 <b>Cliente:</b> <code>${escapeHtml(params.payerName)}</code>`,
    `📧 <b>E-mail:</b> <code>${escapeHtml(params.payerEmail)}</code>`,
    `💵 <b>Valor Pago:</b> <b>${valorFormatado}</b>`,
    params.plan ? `📦 <b>Produto:</b> <code>${escapeHtml(params.plan)}</code>` : null,
    bumpsText ? `✨ <b>Adicionais:</b> <code>${bumpsText}</code>` : null,
    params.crushName ? `💞 <b>Crush (Sinastria):</b> <code>${escapeHtml(params.crushName)}</code>` : null,
    `🆔 <b>ID Transação:</b> <code>${escapeHtml(params.transactionId)}</code>`,
    params.externalId ? `🔖 <b>ID Externo:</b> <code>${escapeHtml(params.externalId)}</code>` : null,
    `⏰ <b>Horário:</b> ${formatBrasiliaDate()}`,
    ``,
    `🎉 <i>Acesso liberado e mapa entregue com sucesso!</i>`,
  ].filter((line): line is string => line !== null);

  await sendTelegramMessage(lines.join("\n"), "Pix confirmado");
}
