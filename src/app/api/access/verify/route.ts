import { NextResponse } from "next/server";
import { getMapAuth, PRIVATE_HEADERS, sameOrigin } from "@/lib/map-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  try {
    const { token_hash, mapId } = await request.json();
    if (typeof token_hash !== "string" || !/^[a-f0-9]{32,128}$/i.test(token_hash) || typeof mapId !== "string" || !/^[a-f0-9-]{36}$/i.test(mapId)) {
      return NextResponse.json({ error: "Link inválido. Solicite um novo acesso." }, { status: 400, headers: PRIVATE_HEADERS });
    }
    const client = await getMapAuth();
    const { data, error } = await client.auth.verifyOtp({ token_hash, type: "email" });
    if (error || !data.user) return NextResponse.json({ error: "Este link expirou ou já foi usado. Solicite um novo abaixo." }, { status: 401, headers: PRIVATE_HEADERS });
    // Both an explicit owner predicate and the user's RLS policies enforce isolation.
    const { data: map } = await client.from("numerology_maps").select("id").eq("id", mapId).eq("user_id", data.user.id).maybeSingle();
    if (!map) return NextResponse.json({ error: "Mapa não encontrado para este acesso." }, { status: 404, headers: PRIVATE_HEADERS });
    return NextResponse.json({ url: `/mapa/${map.id}` }, { headers: PRIVATE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar agora. Tente novamente." }, { status: 503, headers: PRIVATE_HEADERS });
  }
}
