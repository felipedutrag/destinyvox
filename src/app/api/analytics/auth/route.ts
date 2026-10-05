import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/map-auth";
import { adminToken, ANALYTICS_COOKIE, allowAnalytics, analyticsHeaders, validPassword } from "@/lib/analytics-server";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    if ((process.env.ANALYTICS_ADMIN_PASSWORD?.length || 0) < 24) return NextResponse.json({ error: "Configure ANALYTICS_ADMIN_PASSWORD com pelo menos 24 caracteres no servidor." }, { status: 503, headers: analyticsHeaders });
    if (!await allowAnalytics(request, "login", 10, 900)) return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
    const raw = await request.text();
    if (raw.length > 1000) return new Response(null, { status: 413 });
    const body = JSON.parse(raw);
    if (typeof body.password !== "string" || !validPassword(body.password)) return NextResponse.json({ error: "Senha inválida." }, { status: 401, headers: analyticsHeaders });
    const response = NextResponse.json({ ok: true }, { headers: analyticsHeaders });
    response.cookies.set(ANALYTICS_COOKIE, adminToken(Date.now() + 8 * 3600000), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 3600 });
    return response;
  } catch { return NextResponse.json({ error: "Analytics indisponível. Confira a instalação do SQL e as variáveis do servidor." }, { status: 503, headers: analyticsHeaders }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: analyticsHeaders });
  response.cookies.set(ANALYTICS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
