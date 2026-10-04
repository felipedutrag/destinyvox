import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase";
import { CATALOG, type ProductId } from "./catalog";

export function appOrigin() {
  const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) throw new Error("APP_URL não configurada");
  const url = new URL(origin);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("APP_URL deve usar HTTPS");
  return url.origin;
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function generateMapLink(email: string) {
  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token || !data.user) throw new Error("Não foi possível preparar o acesso");
  return { userId: data.user.id, token: data.properties.hashed_token };
}

export function accessEmail(name: string, link: string, product: ProductId = "map") {
  const safeName = escapeHtml(name.split(/\s+/)[0]);
  const safeLink = escapeHtml(link);
  const title = CATALOG[product].name;
  const description = product === "atlas" ? "Explore seus quatro pináculos, as faixas de idade e uma proposta de reflexão para cada capítulo da sua trajetória." : "Explore nove números, suas interpretações e os adicionais que você selecionou na compra.";
  return {
    subject: `Seu ${title} está pronto — DestinyVox`,
    text: `Olá, ${name}! Seu ${title} está pronto. ${description} Acesse: ${link}\nO link é pessoal e de uso único. Após entrar, sua sessão fica salva neste navegador. Suas leituras ficam em ${appOrigin()}/acesso. Se expirar, solicite um novo link nessa página.`,
    html: `<div style="background:#f4f2eb;color:#222;font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:40px 28px;border:1px solid #ddd9ce"><p style="font-size:11px;letter-spacing:4px">DESTINYVOX / SEU MAPA</p><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:38px;line-height:1.1">Um novo olhar<br>sobre você, ${safeName}.</h1><p style="line-height:1.8">Seu ${escapeHtml(title)} está pronto. ${escapeHtml(description)}</p><p style="margin:32px 0"><a href="${safeLink}" style="display:inline-block;background:#222;color:#fff;padding:16px 24px;text-decoration:none;border-radius:4px">Abrir minha leitura →</a></p><p style="font-size:13px;line-height:1.7;color:#666">Você não precisa criar uma senha. Ao abrir a página, confirme o acesso para entrar. Esse passo protege seu link de verificadores automáticos de e-mail.</p><p style="font-size:12px;line-height:1.7;color:#666">Link pessoal e de uso único: não compartilhe. Depois de entrar, sua sessão fica salva neste navegador. Se o link expirar, <a href="${escapeHtml(appOrigin())}/acesso" style="color:#222">solicite um novo acesso</a>.</p></div>`,
  };
}

export async function sendMapAccessEmail(name: string, email: string, mapId: string, token: string, idempotencyKey?: string, product: ProductId = "map") {
  const link = `${appOrigin()}/acesso#${new URLSearchParams({ token_hash: token, mapa: mapId })}`;
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL || "DestinyVox <contato@destinyvox.online>",
    to: email,
    ...accessEmail(name, link, product),
  }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error || !data?.id) throw new Error("Não foi possível enviar o link de acesso");
  return data.id;
}
