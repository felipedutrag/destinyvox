"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Heart, Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { PixCheckout } from "./PixCheckout";
import type { WebMap } from "@/lib/web-map";
import { brl, CATALOG } from "@/lib/catalog";
import { buildSynastry, relationshipTheme, type SynastryReport } from "@/lib/synastry";

type PersonRow = { id: string; name: string; birth_date: string };
type ReportRow = { id: string; person_id: string; report: SynastryReport; created_at: string };
type Space = { people: PersonRow[]; reports: ReportRow[]; credits: number };

export function SynastryReading({ report }: { report: SynastryReport }) {
  return <article className="mt-8 space-y-6" aria-label="Sua sinastria">
    <div className="border-y border-black/20 py-7"><p className="map-eyebrow text-[#875f54]">O encontro de dois mapas</p><h3 className="mt-3 break-words font-editorial text-3xl sm:text-4xl">{report.a.name.split(" ")[0]} <em className="font-normal text-[#875f54]">&</em> {report.b.name.split(" ")[0]}</h3><p className="mt-3 text-xs leading-6 text-muted-foreground">Leitura de {report.referenceDate.split("-").reverse().join("/")} · Os ciclos abaixo ficam registrados nessa data. Reabrir esta comparação não usa outro crédito.</p></div>
    <div className="grid gap-5 lg:grid-cols-2">{report.dimensions.map((axis, index) => <section key={axis.id} className={`border border-black/20 p-5 sm:p-7 ${index === 4 ? "lg:col-span-2" : ""}`}>
      <p className="map-eyebrow text-[#875f54]">0{index + 1} / {axis.title}</p>
      <div className="my-6 flex flex-wrap items-center gap-5"><span className="font-editorial text-5xl">{axis.a}</span><span className="text-muted-foreground">↔</span><span className="font-editorial text-5xl">{axis.b}</span><span className="ml-auto text-xs text-muted-foreground">Tema do encontro<br /><strong className="font-editorial text-3xl font-normal text-[#875f54]">{axis.connection ?? "—"}</strong></span></div>
      <div className="space-y-3 text-sm leading-7"><p>{axis.readingA}</p><p>{axis.readingB}</p><h4 className="pt-3 font-semibold">Onde pode haver encontro</h4><p className="text-muted-foreground">{axis.affinity}</p><h4 className="pt-3 font-semibold">O que merece conversa</h4><p className="text-muted-foreground">{axis.friction}</p><div className="mt-5 bg-[#ece3dc] p-4"><p className="map-eyebrow mb-2">Experimentem a dois</p><p>{axis.practice}</p></div><details className="border-t border-black/10 pt-3"><summary className="cursor-pointer text-xs">Ver como calculamos</summary><p className="mt-2 text-xs leading-6 text-muted-foreground">{axis.calculation}</p></details></div>
    </section>)}</div>
  </article>;
}

export function RelationshipSpace({ map, mapId, demo = false }: { map: WebMap; mapId?: string; demo?: boolean }) {
  const [space, setSpace] = useState<Space | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personId, setPersonId] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [checkout, setCheckout] = useState(false);
  const [active, setActive] = useState<SynastryReport | null>(demo ? buildSynastry(map, { name: "Rafael Almeida", birthDate: "1992-09-23" }, map.referenceDate) : null);
  const endpoint = `/api/maps/${encodeURIComponent(mapId || "")}/relationships`;
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSpace(data);
      if (data.reports?.[0]) {
        setActive(current => current || data.reports[0].report);
        setPersonId(current => current || data.reports[0].person_id);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar suas sinastrias."); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { if (!demo && mapId) void load(); }, [demo, mapId, load]);

  async function post(body: Record<string, unknown>) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Tente novamente em instantes.");
    return data;
  }
  async function savePerson(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await post({ action: "person", name, birthDate });
      setPersonId(data.person.id); setAdding(false); setName(""); setBirthDate(""); await load();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function compare() {
    if (busy || !personId) return;
    const saved = space?.reports.find(row => row.person_id === personId);
    if (saved) { setActive(saved.report); return; }
    setBusy(true); setError("");
    try { const data = await post({ action: "compare", personId }); setActive(data.report.report); await load(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  const alreadyRead = space?.reports.some(row => row.person_id === personId);
  return <section id="relacionamentos" className="scroll-mt-6 border-b border-black/20 py-12 sm:py-16">
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]"><div><p className="map-eyebrow text-[#875f54]">Você nos seus vínculos</p><h2 className="mt-4 font-editorial text-4xl sm:text-5xl">Seu jeito de amar<br /><em className="font-normal text-[#875f54]">também merece atenção.</em></h2></div><p className="max-w-xl self-end text-sm leading-7 text-muted-foreground">Comece reconhecendo suas necessidades. Depois, coloque dois mapas em diálogo para explorar afinidades, diferenças e formas de se aproximar. Use a leitura para abrir conversas, sem transformar números em um veredito sobre a relação.</p></div>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{[["alma", "O que acolhe você"], ["expressao", "Como você se coloca"], ["personalidade", "O que o outro percebe"]].map(([id, title]) => {
      const reading = map.readings.find(r => r.id === id)!; const theme = relationshipTheme(reading.value);
      return <article key={id} className="border border-black/20 p-5 sm:p-6"><p className="map-eyebrow">{title}</p><div className="my-5 flex items-baseline gap-4"><span className="font-editorial text-5xl text-[#875f54]">{reading.value}</span><h3 className="font-editorial text-2xl">{theme.title}</h3></div><p className="text-sm leading-7 text-muted-foreground">Observe como aparece a necessidade de {theme.need}.</p><p className="mt-4 border-t border-black/10 pt-4 text-sm leading-7">{theme.invitation}</p></article>;
    })}</div>
    <div className="mt-10 grid gap-8 border border-black/20 bg-[#ede7df] p-5 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
      <div><Heart className="size-6 text-[#875f54]" /><h3 className="mt-4 font-editorial text-3xl">Uma pessoa.<br />Uma nova perspectiva.</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">Cadastre alguém com nome completo de nascimento e data. Cada crédito abre uma comparação dessa pessoa com este mapa. Ela fica salva para reler sem pagar novamente.</p><p className="mt-4 text-xs leading-6 text-muted-foreground">Cadastrar pessoas é gratuito. Os dados ficam privados na sua conta; use informações que você tem autorização para cadastrar. Uma comparação não entrega o mapa individual completo da outra pessoa.</p></div>
      <div className="min-w-0 space-y-5">
        {demo ? <><p className="map-eyebrow">Exemplo com perfis fictícios</p><p className="text-sm leading-7">Abaixo você explora uma sinastria completa de demonstração. Na sua conta, escolha quem deseja comparar.</p><Button asChild><a href="/sinastria#seu-mapa">Criar meu mapa <ArrowUpRight /></a></Button></> : <>
          <p className="map-eyebrow" role="status">{loading ? "Atualizando suas sinastrias…" : space ? `${space.credits} crédito${space.credits === 1 ? " disponível" : "s disponíveis"} neste mapa` : "Seu espaço de sinastria"}</p>
          {space && <>
            {space.people.length > 0 && <label className="block text-sm">Pessoa para comparar<select className="landing-input" value={personId} onChange={e => setPersonId(e.target.value)} disabled={busy}><option value="">Selecione uma pessoa</option>{space.people.map(p => <option key={p.id} value={p.id}>{p.name} · {p.birth_date.split("-").reverse().join("/")}</option>)}</select></label>}
            {(!space.people.length || adding) ? <form onSubmit={savePerson} className="space-y-4"><label className="block text-sm">Nome completo de nascimento<input className="landing-input" value={name} onChange={e => setName(e.target.value)} required maxLength={150} disabled={busy} /></label><label className="block text-sm">Data de nascimento<input className="landing-input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required min="1900-01-01" max={map.referenceDate} disabled={busy} /></label><Button type="submit" variant="outline" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} Salvar pessoa · gratuito</Button>{adding && <button type="button" onClick={() => setAdding(false)} className="ml-4 text-sm underline">Cancelar</button>}</form> : <Button variant="outline" onClick={() => setAdding(true)} disabled={busy}><Plus /> Cadastrar outra pessoa</Button>}
            {personId && <div><Button className="h-auto min-h-12 w-full whitespace-normal" disabled={busy || loading || (!alreadyRead && space.credits === 0)} onClick={compare}>{busy ? <Loader2 className="animate-spin" /> : <Heart />}{alreadyRead ? "Reler sinastria · sem custo" : "Gerar sinastria · usar 1 crédito"}</Button>{!alreadyRead && <p className="mt-2 text-xs leading-6 text-muted-foreground">Confira os dados antes de gerar. O crédito será usado nesta comparação.</p>}</div>}
            {space.credits === 0 && !checkout && <div className="border-t border-black/20 pt-5"><p className="text-sm leading-7">Uma nova comparação por <strong>{brl(CATALOG.synastry_credit.price)}</strong>. Sem assinatura. O crédito fica vinculado a este mapa.</p><Button className="mt-4 h-auto min-h-12 w-full whitespace-normal" onClick={() => setCheckout(true)}>Comprar 1 crédito · {brl(CATALOG.synastry_credit.price)}</Button></div>}
            {checkout && <div className="border-t border-black/20 pt-5"><PixCheckout product="synastry_credit" sourceMapId={mapId} onDelivered={() => { setCheckout(false); void load(); }} /></div>}
          </>}
          {error && <div role="alert"><p className="text-sm leading-7 text-red-800">{error}</p><button className="mt-2 text-sm underline" onClick={() => void load()} disabled={loading}>Tentar novamente</button></div>}
        </>}
      </div>
    </div>
    {!!space?.reports.length && <div className="mt-8"><p className="map-eyebrow mb-4">Suas comparações salvas · releitura gratuita</p><div className="flex flex-wrap gap-3">{space.reports.map(row => <Button key={row.id} variant="outline" className="h-auto whitespace-normal py-3" onClick={() => { setActive(row.report); setPersonId(row.person_id); }}>{row.report.b.name}<ArrowUpRight /></Button>)}</div></div>}
    {active && <SynastryReading report={active} />}
  </section>;
}
