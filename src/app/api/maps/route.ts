import { NextResponse } from "next/server";
import { getMapAuth, PRIVATE_HEADERS } from "@/lib/map-auth";
import { CATALOG } from "@/lib/catalog";

export async function GET() {
  try {
    const client = await getMapAuth();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Entre para acessar suas leituras." }, { status: 401, headers: PRIVATE_HEADERS });
    const { data, error } = await client.from("numerology_maps").select("id, customer_name, full_interpretation, created_at").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ maps: data.map(map => ({ id: map.id, name: map.customer_name, title: CATALOG[map.full_interpretation?.purchase?.product === "atlas" ? "atlas" : "map"].name })) }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: "Não foi possível carregar suas leituras." }, { status: 503, headers: PRIVATE_HEADERS }); }
}
