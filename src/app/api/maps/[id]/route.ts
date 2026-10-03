import { NextResponse } from "next/server";
import { getMapAuth, PRIVATE_HEADERS } from "@/lib/map-auth";
import { buildWebMap } from "@/lib/web-map";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await getMapAuth();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Entre para acessar seu mapa." }, { status: 401, headers: PRIVATE_HEADERS });
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Mapa não encontrado." }, { status: 404, headers: PRIVATE_HEADERS });
    const { data: map, error } = await client.from("numerology_maps")
      .select("id, customer_name, birth_date, status")
      .eq("id", id).eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!map) return NextResponse.json({ error: "Mapa não encontrado para este acesso." }, { status: 404, headers: PRIVATE_HEADERS });
    if (map.status !== "completed") return NextResponse.json({ error: "Seu mapa ainda está sendo preparado. Tente novamente em instantes." }, { status: 409, headers: PRIVATE_HEADERS });
    return NextResponse.json(buildWebMap(map.customer_name, map.birth_date), { headers: PRIVATE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o mapa. Tente novamente." }, { status: 503, headers: PRIVATE_HEADERS });
  }
}
