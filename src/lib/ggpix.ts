import crypto from "crypto";

export interface GGPIXPayer {
  name?: string | null;
  document?: string | null;
  bankName?: string | null;
}

export interface GGPIXRecipient {
  name?: string | null;
  document?: string | null;
  bankName?: string | null;
}

export type GGPIXEventType =
  | "PIX_IN"
  | "BOLETO_IN"
  | "PIX_OUT"
  | "BOLETO_OUT"
  | "TED_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "CARD_IN"
  | "CARD_REFUND";

export type GGPIXTransactionStatus = "PENDING" | "COMPLETE" | "FAILED" | "CANCELED";

export interface GGPIXWebhookPayload {
  transactionId: string;
  externalId: string;
  status: GGPIXTransactionStatus;
  type: GGPIXEventType;
  amount: number; // Valor em centavos
  netAmount?: number;
  gatewayFee?: number;
  paidAt?: string | null;
  createdAt?: string;
  merchantId?: string;
  endToEndId?: string | null;
  payer?: GGPIXPayer | null;
  recipient?: GGPIXRecipient | null;
  failureReason?: string | null;
  test?: boolean;
  card?: Record<string, unknown>;
}

export interface GGPIXWebhookItem {
  id: string;
  url: string;
  label?: string;
  events?: string[] | null;
  active: boolean;
  primary: boolean;
  authType: string;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  lastFailureError?: string | null;
  consecutiveFailures: number;
  createdAt: string;
}

/**
 * Obtém a chave da API GGPIX configurada no ambiente
 */
export function getGGPIXApiKey(): string {
  let key = process.env.GGPIX_KEY_FINAL || process.env.GGPIX_API_KEY || "";
  key = key.trim().replace(/^["'](.+)["']$/, "$1");
  return key;
}

const GGPIX_BASE_URL = "https://ggpixapi.com/api/v1";

/**
 * Validação de Assinatura HMAC e/ou Bearer Token do Webhook GGPIX
 */
export function verifyGGPIXWebhook({
  rawBody,
  signatureHeader,
  authHeader,
}: {
  rawBody: string;
  signatureHeader?: string | null;
  authHeader?: string | null;
}): { valid: boolean; reason?: string } {
  const hmacSecret = process.env.GGPIX_WEBHOOK_SECRET || process.env.GGPIX_HMAC_SECRET;
  const bearerToken = process.env.GGPIX_WEBHOOK_TOKEN || process.env.GGPIX_BEARER_TOKEN;

  // 1. Se Bearer Token estiver configurado, validar
  if (bearerToken) {
    if (!authHeader) {
      return { valid: false, reason: "Header de autorização Bearer ausente" };
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token !== bearerToken.trim()) {
      return { valid: false, reason: "Bearer token inválido" };
    }
  }

  // 2. Se HMAC Secret estiver configurado, validar HMAC-SHA256
  if (hmacSecret) {
    if (!signatureHeader) {
      return { valid: false, reason: "Header X-Webhook-Signature ausente" };
    }

    try {
      // Formato: t=1705315530,v1=5d4f8c2a1b3e...
      const parts = signatureHeader.split(",");
      const tPart = parts.find((p) => p.trim().startsWith("t="));
      const v1Part = parts.find((p) => p.trim().startsWith("v1="));

      if (!tPart || !v1Part) {
        return { valid: false, reason: "Formato do header X-Webhook-Signature inválido" };
      }

      const timestamp = tPart.replace("t=", "").trim();
      const receivedSig = v1Part.replace("v1=", "").trim();

      // Verificar idade da assinatura para proteção contra replay attack (máx 5 min = 300s)
      const ageSeconds = Date.now() / 1000 - parseInt(timestamp, 10);
      if (ageSeconds > 300 || ageSeconds < -60) {
        return { valid: false, reason: "Assinatura do webhook expirada ou timestamp futuro" };
      }

      // Calcular HMAC-SHA256(timestamp.rawBody)
      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSig = crypto
        .createHmac("sha256", hmacSecret.trim())
        .update(signedPayload)
        .digest("hex");

      const receivedBuf = Buffer.from(receivedSig, "hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");

      if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
        return { valid: false, reason: "Assinatura HMAC incorreta" };
      }
    } catch (err) {
      return { valid: false, reason: `Erro ao validar HMAC: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // Se nenhum secret estiver configurado, a API da GGPIX envia sem headers de autenticação
  return { valid: true };
}

/**
 * Cliente REST GGPIX
 */
export const ggpixClient = {
  /**
   * Consulta status de uma transação por ID
   */
  async getTransaction(transactionId: string) {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    return await res.json();
  },

  /**
   * Lista todos os webhooks cadastrados na conta GGPIX
   */
  async listWebhooks(): Promise<{ webhooks: GGPIXWebhookItem[]; availableEvents: string[]; maxWebhooks: number }> {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/webhooks`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Erro ao listar webhooks: ${JSON.stringify(err)}`);
    }

    return await res.json();
  },

  /**
   * Cadastra uma URL de destino de webhook na GGPIX
   */
  async registerWebhook(params: {
    url: string;
    label?: string;
    events?: GGPIXEventType[];
    secret?: string;
    bearerToken?: string;
  }) {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Erro ao cadastrar webhook GGPIX: ${JSON.stringify(data)}`);
    }

    return data;
  },

  /**
   * Altera ou pausa um webhook na GGPIX
   */
  async updateWebhook(id: string, params: { url?: string; label?: string; events?: string[]; active?: boolean }) {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/webhooks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Erro ao atualizar webhook GGPIX: ${JSON.stringify(data)}`);
    }

    return data;
  },

  /**
   * Remove um webhook cadastrado na GGPIX
   */
  async deleteWebhook(id: string) {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/webhooks/${id}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Erro ao remover webhook GGPIX: ${JSON.stringify(data)}`);
    }

    return data;
  },

  /**
   * Dispara um evento de teste no webhook informado
   */
  async testWebhook(id: string) {
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Chave da API GGPIX não configurada (GGPIX_KEY_FINAL)");

    const res = await fetch(`${GGPIX_BASE_URL}/webhooks/${id}/test`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    return await res.json();
  },
};
