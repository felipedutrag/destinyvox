"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, ChevronRight, Loader2, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WebMap } from "@/lib/web-map";
import { cn } from "@/lib/utils";
import { AtlasOffer, ProductChapters } from "./ProductChapters";
import { RelationshipSpace } from "./RelationshipSpace";

export function MapReader({ mapId, demo }: { mapId?: string; demo?: WebMap }) {
  const [map, setMap] = useState<WebMap | null>(demo || null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState("caminho");
  const [expanded, setExpanded] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const detailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    setError(""); setNeedsLogin(false);
    fetch(`/api/maps/${encodeURIComponent(mapId || "")}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (response.status === 401) setNeedsLogin(true);
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar seu mapa.");
        setMap(data);
      }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [mapId, demo, attempt]);

  if (!map) return <main className="map-theme min-h-screen grid place-items-center p-6">
    <div className="max-w-sm text-center space-y-6">
      <span className="map-eyebrow">DestinyVox / seu mapa</span>
      <h1 className="font-editorial text-4xl">{error ? "Vamos reencontrar seu mapa." : "Um instante para você."}</h1>
      {error ? <><p role="alert" className="text-sm leading-7 text-muted-foreground">{error}</p>{needsLogin ? <Button asChild><a href="/acesso">Receber link de acesso <ArrowUpRight /></a></Button> : <Button onClick={() => setAttempt(n => n + 1)}>Tentar novamente</Button>}</> : <p role="status" className="flex justify-center items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Preparando sua leitura…</p>}
    </div>
  </main>;

  const active = map.readings.find(r => r.id === selected) || map.readings[0];
  const isAtlas = map.purchase?.product === "atlas";
  const firstName = map.name.split(" ")[0];
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${map.referenceDate}T12:00:00Z`));
  const visibleReadings = map.readings.filter(r => filter === "all" || r.group === filter);
  function selectReading(id: string) {
    setSelected(id); setExpanded(false);
    detailRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    detailRef.current?.focus({ preventScroll: true });
  }
  async function logout() {
    setLogoutBusy(true);
    try {
      const response = await fetch("/api/access/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.assign("/acesso");
    } catch { setError("Não foi possível sair agora. Tente novamente."); setLogoutBusy(false); }
  }

  return <div className="map-theme min-h-screen">
    {demo && <div className="border-b border-black/15 bg-[#e5e2d8] px-4 py-2 text-center text-xs">Demonstração local · Perfil fictício · Nenhum pagamento necessário</div>}
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-black/20 px-5 py-6 sm:px-10">
      <a href="/" className="map-eyebrow flex items-center gap-3"><span className="text-2xl leading-none">✳</span> DestinyVox</a>
      <div className="flex items-center gap-5">{!demo && <a href="/acesso" className="map-eyebrow border-b border-black/20 text-muted-foreground">Minhas leituras</a>}{!demo && <Button variant="ghost" size="sm" onClick={logout} disabled={logoutBusy}><LogOut /> Sair</Button>}</div>
    </header>
    <main className="mx-auto max-w-7xl px-5 sm:px-10">
      {isAtlas && <section className="grid gap-8 border-b border-black/20 py-12 sm:py-16 lg:grid-cols-[1.3fr_1fr]"><div><p className="map-eyebrow text-muted-foreground">O Atlas de {firstName} / Ciclos de Vida</p><h1 className="mt-6 font-editorial text-5xl leading-tight sm:text-6xl">Sua história tem fases.<br /><em className="text-[#77766e]">Cada uma, um convite.</em></h1><p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">Explore os quatro pináculos calculados com seu nascimento. Releia o caminho percorrido, observe o capítulo atual e escolha o que deseja cultivar daqui para a frente.</p><a href={demo ? "/mapa/demo" : "/acesso"} className="mt-6 inline-flex items-center gap-2 border-b border-black/30 pb-1 text-sm">Voltar às minhas leituras <ArrowUpRight className="size-4" /></a></div><div className="flex flex-col justify-center border border-black/20 p-8"><p className="map-eyebrow">Seu pináculo atual</p><span className="my-5 font-editorial text-8xl">{map.modules?.find(m => m.id === "atlas")?.entries.find(e => e.current)?.number}</span><p className="font-editorial text-2xl">{map.modules?.find(m => m.id === "atlas")?.entries.find(e => e.current)?.title}</p><p className="mt-4 text-xs leading-6 text-muted-foreground">Referência: {dateLabel}. A etapa é atualizada conforme sua idade.</p></div></section>}
      {!isAtlas && <>
      <section className="grid gap-10 border-b border-black/20 py-10 sm:py-14 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div>
          <p className="map-eyebrow mb-6">O mapa de {firstName} <span className="mx-2">/</span> Numerologia pitagórica</p>
          <h1 className="font-editorial text-5xl leading-[1.06] tracking-tight sm:text-7xl">Você não cabe<br />em uma definição.<br /><em className="text-[#77766e]">Comece por nove.</em></h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-muted-foreground">Seu nome. Sua história. O momento que você vive. Explore as diferentes partes de si, um número de cada vez.</p>
          <a href="#numeros" className="mt-7 inline-flex items-center gap-3 border-b border-black pb-2 text-sm">Explorar meus números <ArrowDown className="size-4" /></a>
          <div className="mt-5"><a href="#relacionamentos" className="inline-flex items-center gap-3 border-b border-[#875f54]/50 pb-2 text-sm text-[#875f54]">Relacionamentos e sinastrias <ArrowDown className="size-4" /></a></div>
        </div>
        <div className="flex flex-col justify-between border border-black/20 p-6 sm:p-8">
          <div className="flex items-center justify-between"><span className="map-eyebrow">Sua assinatura</span><span className="text-xs text-muted-foreground">01 / 09</span></div>
          <div className="relative flex min-h-56 items-center justify-center py-5" aria-hidden="true">
            <svg viewBox="0 0 300 220" className="absolute h-full w-full max-w-sm fill-none stroke-current text-black/25">
              <ellipse cx="150" cy="110" rx="120" ry="66" transform="rotate(-28 150 110)" />
              <ellipse cx="150" cy="110" rx="120" ry="66" transform="rotate(28 150 110)" />
              <circle cx="150" cy="110" r="90" strokeDasharray="2 6" />
              <path d="M150 5v25M137 18h26M272 110h20M282 100v20M25 161h18M34 152v18" />
            </svg>
            <span className="relative font-editorial text-[112px] leading-none">{map.readings[0].value}</span>
          </div>
          <div className="border-t border-black/15 pt-5"><p className="map-eyebrow text-muted-foreground">Caminho de Vida · {map.archetype}</p><p className="mt-3 font-editorial text-xl italic leading-relaxed">“{map.dictum}”</p></div>
        </div>
      </section>

      <section id="numeros" className="scroll-mt-5 py-10 sm:py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div><p className="map-eyebrow text-muted-foreground">Uma visão de conjunto</p><h2 className="mt-2 font-editorial text-3xl sm:text-4xl">As partes do seu todo.</h2></div>
          <div role="group" aria-label="Filtrar números" className="flex gap-1 rounded-md border border-black/15 p-1">
            {[["all", "Todos"], ["essence", "Essência"], ["cycles", "Ciclos"]].map(([value, label]) => <Button key={value} variant={filter === value ? "default" : "ghost"} size="sm" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {visibleReadings.map(reading => <Card key={reading.id} className={cn("overflow-hidden rounded-sm border-black/20 bg-transparent shadow-none transition-colors", selected === reading.id && "bg-[#e8e5dc] border-black/60")}>
            <button aria-pressed={selected === reading.id} aria-label={`Ler ${reading.label}, número ${reading.value}`} onClick={() => selectReading(reading.id)} className="flex h-full min-h-44 w-full flex-col items-start p-4 text-left outline-offset-[-4px] transition-colors hover:bg-black/5 focus-visible:outline-2 sm:p-6">
              <span className="flex w-full items-start justify-between gap-2"><span className="map-eyebrow text-[10px] sm:text-[11px]">{reading.label}</span>{selected === reading.id ? <Check className="size-3.5 shrink-0" /> : <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />}</span>
              <span className="my-3 font-editorial text-5xl leading-none sm:text-6xl">{reading.value}</span>
              <span className="mt-auto text-xs leading-5 text-muted-foreground sm:text-sm">{reading.subtitle}</span>
            </button>
          </Card>)}
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">Os números da sua essência permanecem. Os ciclos acompanham o calendário. Referência: {dateLabel} · horário de Brasília.</p>
      </section>

      <section ref={detailRef} tabIndex={-1} aria-label={`Interpretação de ${active.label}`} className="scroll-mt-6 border-y border-black/20 py-10 outline-none sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="map-eyebrow text-muted-foreground">Leitura em profundidade</p>
            <div className="mt-5 flex items-center gap-5"><span className="font-editorial text-8xl">{active.value}</span><div><h2 className="font-editorial text-3xl">{active.label}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{active.subtitle}</p></div></div>
            <div className="mt-8 border-t border-black/15 pt-5"><p className="map-eyebrow">Como chegamos aqui</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{active.calculation}</p></div>
            <div className="mt-8 border border-black/15 p-5"><Sparkles className="mb-4 size-5" /><p className="map-eyebrow">Leve esta pergunta com você</p><p className="mt-3 font-editorial text-2xl leading-snug">{active.reflection}</p></div>
          </div>
          <article className="min-w-0" aria-live="polite">
            <p className="map-eyebrow mb-6">{firstName}, um convite para se observar.</p>
            <div className="space-y-5 text-[15px] leading-8 text-[#46463f] sm:text-base">{(expanded ? active.paragraphs : active.paragraphs.slice(0, 2)).map((paragraph, index) => <p key={`${active.id}-${index}`}>{paragraph}</p>)}</div>
            {active.paragraphs.length > 2 && <Button variant="outline" className="mt-7" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Recolher leitura" : "Ler interpretação completa"}<ChevronRight className={expanded ? "-rotate-90" : "rotate-90"} /></Button>}
          </article>
        </div>
      </section>

      </>}
      <ProductChapters modules={map.modules || []} />
      {!isAtlas && <RelationshipSpace map={map} mapId={mapId} demo={!!demo} />}
      {!isAtlas && <AtlasOffer mapId={mapId} demo={!!demo} upgradeMapId={map.upgradeMapId} onDelivered={() => setAttempt(n => n + 1)} />}
      <section className="grid gap-7 py-10 sm:grid-cols-[1fr_2fr] sm:py-12">
        <p className="map-eyebrow">Você continua sendo<br className="hidden sm:block" /> a pessoa que escolhe.</p>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">Leia com curiosidade. Perceba o que ressoa, questione o que não combina com você e volte quando quiser. A numerologia é uma linguagem simbólica de autoconhecimento: estas interpretações não determinam sua personalidade nem preveem acontecimentos.</p>
      </section>
      {error && <p role="alert" className="pb-5 text-sm text-red-800">{error}</p>}
    </main>
    <footer className="border-t border-black/20 px-5 py-6 text-center"><p className="map-eyebrow text-muted-foreground">DestinyVox · Um olhar para dentro.</p></footer>
  </div>;
}
