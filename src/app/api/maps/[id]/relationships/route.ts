import { NextResponse } from "next/server";
import { getMapAuth, PRIVATE_HEADERS, sameOrigin } from "@/lib/map-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateCustomer } from "@/lib/catalog";
import { buildSynastry } from "@/lib/synastry";
import { brazilianDate } from "@/lib/web-map";

const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: PRIVATE_HEADERS });
type Context = { params: Promise<{ id: string }> };

async function ownedMap(context: Context) {
  const client = await getMapAuth();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { response: json({ error: "Entre para acessar seus relacionamentos." }, 401) };
  const { id } = await context.params;
  if (!uuid(id)) return { response: json({ error: "Mapa não encontrado." }, 404) };
  const { data: map, error } = await client.from("numerology_maps").select("id, customer_name, birth_date, full_interpretation").eq("id", id).eq("user_id", user.id).eq("status", "completed").maybeSingle();
  if (error) throw error;
  if (!map || map.full_interpretation?.purchase?.product === "atlas") return { response: json({ error: "Mapa não encontrado." }, 404) };
  return { client, user, map };
}

export async function GET(_request: Request, context: Context) {
  try {
    const access = await ownedMap(context);
    if (access.response) return access.response;
    const { client, user, map } = access;
    const [people, reports, payments] = await Promise.all([
      client.from("relationship_people").select("id, name, birth_date").eq("user_id", user.id).order("created_at"),
      client.from("synastry_reports").select("id, person_id, payment_id, report, created_at").eq("user_id", user.id).eq("map_id", map.id).order("created_at", { ascending: false }),
      client.from("payments").select("id, map_id, metadata").eq("user_id", user.id).eq("status", "PAID").or(`map_id.eq.${map.id},metadata->>sourceMapId.eq.${map.id}`),
    ]);
    if (people.error || reports.error || payments.error) throw people.error || reports.error || payments.error;
    const spent = new Set(reports.data.map(row => row.payment_id));
    const credits = payments.data.filter(p => !spent.has(p.id) && (
      (p.map_id === map.id && p.metadata?.product === "map" && Array.isArray(p.metadata?.bumps) && p.metadata.bumps.includes("synastry")) ||
      (p.metadata?.product === "synastry_credit" && p.metadata?.sourceMapId === map.id)
    )).length;
    return json({ people: people.data, reports: reports.data.map(({ payment_id: _payment, ...report }) => report), credits });
  } catch { return json({ error: "Não foi possível abrir suas sinastrias agora. Tente novamente em instantes." }, 503); }
}

export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return json({ error: "Origem inválida." }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "Dados inválidos." }, 400);
  try {
    const access = await ownedMap(context);
    if (access.response) return access.response;
    const { user, map } = access;
    const admin = getSupabaseAdmin();
    if (body.action === "person") {
      let person;
      try { person = validateCustomer({ name: body.name, birthDate: body.birthDate, email: "profile@example.invalid" }, brazilianDate()); }
      catch (error) { return json({ error: (error as Error).message }, 400); }
      const { data: existing, error: existingError } = await admin.from("relationship_people").select("id, name, birth_date").eq("user_id", user.id).eq("name", person.name).eq("birth_date", person.birthDate).maybeSingle();
      if (existingError) throw existingError;
      if (existing) return json({ person: existing });
      const { count, error: countError } = await admin.from("relationship_people").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if (countError) throw countError;
      if ((count || 0) >= 50) return json({ error: "Você atingiu o limite de 50 pessoas cadastradas." }, 409);
      const { data, error } = await admin.from("relationship_people").upsert({ user_id: user.id, name: person.name, birth_date: person.birthDate }, { onConflict: "user_id,name,birth_date" }).select("id, name, birth_date").single();
      if (error) throw error;
      return json({ person: data }, 201);
    }
    if (body.action !== "compare" || !uuid(body.personId)) return json({ error: "Escolha uma pessoa cadastrada." }, 400);
    const { data: person, error: personError } = await admin.from("relationship_people").select("id, name, birth_date").eq("id", body.personId).eq("user_id", user.id).maybeSingle();
    if (personError) throw personError;
    if (!person) return json({ error: "Pessoa não encontrada." }, 404);
    const report = buildSynastry({ name: map.customer_name, birthDate: map.birth_date }, { name: person.name, birthDate: person.birth_date });
    const { data, error } = await admin.rpc("create_synastry", { p_user: user.id, p_map: map.id, p_person: person.id, p_report: report });
    if (error?.message.includes("NO_CREDIT")) return json({ error: "Você precisa de um crédito para criar uma nova sinastria." }, 402);
    if (error) throw error;
    return json({ report: { id: data.id, person_id: data.person_id, report: data.report, created_at: data.created_at } });
  } catch { return json({ error: "Não foi possível salvar agora. Tente novamente; uma comparação já gerada não consome outro crédito." }, 503); }
}
