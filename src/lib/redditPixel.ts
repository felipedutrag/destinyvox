/**
 * Utilitário de rastreamento do Reddit Ads Pixel
 * Dispara eventos padrão do Reddit Ads com metadados do produto.
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
  products?: RedditProductItem[];
  [key: string]: any;
}

/**
 * Dispara um evento genérico no Reddit Ads Pixel via window.rdt('track', eventName, metadata)
 */
export function trackRedditEvent(
  eventName: "PageVisit" | "InitiateCheckout" | "AddToCart" | "Purchase" | "SignUp" | "Lead" | "Custom" | string,
  metadata?: RedditEventMetadata
): boolean {
  if (typeof window === "undefined") return false;

  if (typeof window.rdt === "function") {
    try {
      const finalEventName = eventName;
      const finalMetadata = metadata ? { ...metadata } : {};

      if (Object.keys(finalMetadata).length > 0) {
        window.rdt("track", finalEventName, finalMetadata);
      } else {
        window.rdt("track", finalEventName);
      }
      console.log(`🎯 [Reddit Pixel] Evento '${eventName}' disparado como '${finalEventName}':`, finalMetadata || {});
      return true;
    } catch (err) {
      console.error(`❌ [Reddit Pixel] Erro ao disparar '${eventName}':`, err);
      return false;
    }
  } else {
    console.warn(
      `⚠️ [Reddit Pixel] window.rdt não está pronto ou foi bloqueado por adblock. Evento '${eventName}':`,
      metadata
    );
    return false;
  }
}

/**
 * Registra a inclusão da leitura personalizada no fluxo de compra.
 */
export function trackRedditAddToCart(params: {
  value: number;
  currency?: string;
  plan?: string;
}) {
  const planName =
    params.plan === "complete_numerology_reading"
      ? "Complete Personal Numerology Reading"
      : params.plan === "30_questions" || params.plan === "vip"
      ? "DestinyVox VIP — 30 Consultas & Mapa Pitagórico Completo"
      : "DestinyVox Essencial — 10 Consultas";

  const payload: RedditEventMetadata = {
    currency: params.currency || "USD",
    value: Number(params.value.toFixed(2)),
    itemCount: 1,
    products: [
      {
        id: params.plan || "vip",
        name: planName,
        category: "Numerologia",
      },
    ],
  };

  console.log(`🛒 [Reddit Pixel] AddToCart disparado para plano [${params.plan}]:`, payload);
  trackRedditEvent("AddToCart", payload);
}

/**
 * Dispara o evento de Purchase do Reddit Ads (ao confirmar o pagamento)
 */
export function trackRedditPurchase(params: {
  value: number;
  currency?: string;
  plan?: string;
}): boolean {
  const planName =
    params.plan === "complete_numerology_reading"
      ? "Complete Personal Numerology Reading"
      : params.plan === "30_questions" || params.plan === "vip"
      ? "DestinyVox VIP — 30 Consultas & Mapa Pitagórico Completo"
      : "DestinyVox Essencial — 10 Consultas";

  const payload: RedditEventMetadata = {
    currency: params.currency || "USD",
    value: Number(params.value.toFixed(2)),
    itemCount: 1,
    products: [
      {
        id: params.plan || "vip",
        name: planName,
        category: "Numerologia",
      },
    ],
  };

  const tracked = trackRedditEvent("Purchase", payload);
  if (tracked) console.log("💰 [Reddit Pixel] Purchase enviado à fila do pixel:", payload);
  return tracked;
}
