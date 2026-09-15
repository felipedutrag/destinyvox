const DEFAULT_BOT_TOKEN = "8772913024:AAHCsGyYaf11MkncGCHSwj-q8OJVYzQ6v8c";
const DEFAULT_CHAT_ID = "8024902234";

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
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("[telegram] Telegram credentials not found. Skipping alert.");
    return;
  }

  const lines = [
    `💰 <b>PAGAMENTO STRIPE APROVADO!</b> 💳`,
    ``,
    `👤 <b>Usuário Reddit:</b> <code>u/${params.redditUsername}</code>`,
    `📦 <b>Plano:</b> <code>${params.plan}</code>`,
    `🔮 <b>Créditos Adicionados:</b> <b>+${params.credits}</b> perguntas`,
    `💵 <b>Valor:</b> ${params.currency.toUpperCase()} $${params.amount.toFixed(2)}`,
    params.customerEmail ? `📧 <b>E-mail:</b> <code>${params.customerEmail}</code>` : null,
    `🆔 <b>ID Transação:</b> <code>${params.paymentId}</code>`,
    `⏰ <b>Data/Hora:</b> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    ``,
    `✨ <i>DestinyVox VIP Portal</i>`,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[telegram] Erro ao enviar alerta Telegram:", errorText);
    } else {
      console.log("[telegram] ✅ Alerta de pagamento enviado ao Telegram com sucesso.");
    }
  } catch (error) {
    console.error("[telegram] Falha ao despachar notificação Telegram:", error);
  }
}

export type TelegramPixAlertParams = {
  payerName: string;
  payerEmail: string;
  amountCents: number;
  transactionId: string;
  externalId?: string;
  plan?: string;
};

/**
 * Envia notificação em tempo real no Telegram quando um PIX da GGPIX for aprovado.
 */
export async function sendTelegramPixNotification(
  params: TelegramPixAlertParams
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!botToken || !chatId) {
    return;
  }

  const valorFormatado = (params.amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const lines = [
    `⚡ <b>PIX CONFIRMADO (GGPIX)!</b> 💚`,
    ``,
    `👤 <b>Cliente:</b> <code>${params.payerName}</code>`,
    `📧 <b>E-mail:</b> <code>${params.payerEmail}</code>`,
    `💵 <b>Valor:</b> <b>${valorFormatado}</b>`,
    params.plan ? `📦 <b>Plano:</b> <code>${params.plan}</code>` : null,
    `🆔 <b>ID Transação:</b> <code>${params.transactionId}</code>`,
    `⏰ <b>Horário:</b> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    ``,
    `📜 <i>Mapa Pitagórico gerado e entregue por e-mail!</i>`,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.warn("[telegram] Aviso ao enviar alerta PIX:", err);
  }
}

