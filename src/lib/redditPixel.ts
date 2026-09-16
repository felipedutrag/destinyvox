/**
 * Utilitário de rastreamento do Reddit Ads Pixel
 * Suporta os eventos padrões InitiateCheckout e Purchase com metadados.
 * Funciona em produção e em modo de desenvolvimento (localhost).
 */

declare global {
  interface Window {
    rdt?: (...args: any[]) => void;
  }
}

export interface RedditProductItem {
  id: string;
  name: string;
  category?: string;
}

export interface RedditEventMetadata {
  currency?: string;
  value?: number;
  itemCount?: number;
  transactionId?: string;
  conversionId?: string;
  products?: RedditProductItem[];
  [key: string]: any;
}

/**
 * Dispara um evento genérico no Reddit Ads Pixel via window.rdt('track', eventName, metadata)
 */
export function trackRedditEvent(
  eventName: "PageVisit" | "InitiateCheckout" | "AddToCart" | "Purchase" | "SignUp" | "Lead" | "Custom" | string,
  metadata?: RedditEventMetadata
) {
  if (typeof window === "undefined") return;

  if (typeof window.rdt === "function") {
    try {
      let finalEventName = eventName;
      let finalMetadata = metadata ? { ...metadata } : {};

      // Send as AddToCart standard event for Reddit
      if (eventName === "InitiateCheckout") {
        finalEventName = "AddToCart";
      }

      if (Object.keys(finalMetadata).length > 0) {
        window.rdt("track", finalEventName, finalMetadata);
      } else {
        window.rdt("track", finalEventName);
      }
      console.log(`🎯 [Reddit Pixel] Evento '${eventName}' disparado como '${finalEventName}':`, finalMetadata || {});
    } catch (err) {
      console.error(`❌ [Reddit Pixel] Erro ao disparar '${eventName}':`, err);
    }
  } else {
    console.warn(
      `⚠️ [Reddit Pixel] window.rdt não está pronto ou foi bloqueado por adblock. Evento '${eventName}':`,
      metadata
    );
  }
}

/**
 * Dispara o evento de InitiateCheckout do Reddit Ads (ao gerar o QR Code do PIX ou iniciar checkout)
 */
export function trackRedditInitiateCheckout(params: {
  value: number;
  currency?: string;
  transactionId?: string;
  plan?: string;
}) {
  const planName =
    params.plan === "30_questions" || params.plan === "vip"
      ? "DestinyVox VIP — 30 Consultas & Mapa Pitagórico Completo"
      : "DestinyVox Essencial — 10 Consultas";

  const payload: RedditEventMetadata = {
    currency: params.currency || "BRL",
    value: Number(params.value.toFixed(2)),
    itemCount: 1,
    // AddToCart doesn't support transactionId or conversionId, so we omit them here.
    products: [
      {
        id: params.plan || "vip",
        name: planName,
        category: "Numerologia",
      },
    ],
  };

  console.log(`💳 [Reddit Pixel] InitiateCheckout disparado para plano [${params.plan}]:`, payload);
  trackRedditEvent("InitiateCheckout", payload);
}

/**
 * Dispara o evento de Purchase do Reddit Ads (ao confirmar o pagamento)
 */
export function trackRedditPurchase(params: {
  value: number;
  currency?: string;
  transactionId: string;
  conversionId?: string;
  plan?: string;
}) {
  const planName =
    params.plan === "30_questions" || params.plan === "vip"
      ? "DestinyVox VIP — 30 Consultas & Mapa Pitagórico Completo"
      : "DestinyVox Essencial — 10 Consultas";

  const payload: RedditEventMetadata = {
    currency: params.currency || "BRL",
    value: Number(params.value.toFixed(2)),
    itemCount: 1,
    transactionId: params.transactionId,
    conversionId: params.conversionId || params.transactionId,
    products: [
      {
        id: params.plan || "vip",
        name: planName,
        category: "Numerologia",
      },
    ],
  };

  console.log(`💰 [Reddit Pixel] Purchase disparado com sucesso:`, payload);
  trackRedditEvent("Purchase", payload);
}
