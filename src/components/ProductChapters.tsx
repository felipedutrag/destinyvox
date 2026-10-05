"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { PixCheckout } from "./PixCheckout";
import { CATALOG, brl } from "@/lib/catalog";
import type { ProductModule } from "@/lib/map-products";
import { track } from "@/lib/analytics-client";

export function ProductChapters({ modules }: { modules: ProductModule[] }) {
  return <>{modules.length > 0 && <nav aria-label="Seus aprofundamentos" className="flex flex-wrap gap-3 border-b border-black/20 py-6">{modules.map(module => <a key={module.id} href={`#capitulo-${module.id}`} className="flex items-center gap-2 rounded-sm border border-black/20 px-3 py-2 text-xs hover:bg-black/5"><Check className="size-3" />{module.title}</a>)}</nav>}
    {modules.map(module => <section key={module.id} id={`capitulo-${module.id}`} className="scroll-mt-6 border-b border-black/20 py-10 sm:py-14">
      <div className="mb-8 grid gap-5 lg:grid-cols-2"><div><p className="map-eyebrow text-muted-foreground">{module.id === "atlas" ? "Sua trajetória em quatro capítulos" : "Incluído na sua compra"}</p><h2 className="mt-3 font-editorial text-3xl sm:text-4xl">{module.title}</h2></div><p className="max-w-xl text-sm leading-7 text-muted-foreground">{module.intro}</p></div>
      <div className={`grid items-start gap-4 ${module.id === "calendar" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
        {module.entries.map((entry, index) => <details key={`${module.id}-${index}`} open={entry.current || undefined} className="group rounded-sm border border-black/20 bg-[#eeece3] p-5 sm:p-6">
          <summary className="cursor-pointer list-none"><div className="mb-4 flex items-start justify-between gap-3"><span className="map-eyebrow text-[9px]">{entry.current ? "Você está aqui" : `Leitura ${String(index + 1).padStart(2, "0")}`}</span><Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" /></div><span className="font-editorial text-5xl leading-none">{entry.number}</span><h3 className="mt-4 font-editorial text-2xl leading-snug">{entry.title}</h3><span className="mt-3 block text-xs text-muted-foreground group-open:hidden">Abrir interpretação e exercício</span></summary>
          <div className="mt-5 space-y-4 border-t border-black/15 pt-5"><p className="text-xs leading-6 text-muted-foreground"><strong className="font-medium">O cálculo: </strong>{entry.calculation}</p>{entry.paragraphs.map((text, i) => <p key={i} className="text-sm leading-7 text-[#46463f]">{text}</p>)}<div className="border-l-2 border-[#7b806d] pl-4"><p className="map-eyebrow text-[9px]">Da leitura para a vida</p><p className="mt-2 text-sm leading-7">{entry.practice}</p></div></div>
        </details>)}
      </div>
    </section>)}
  </>;
}

export function AtlasOffer({ mapId, demo, upgradeMapId, onDelivered }: { mapId?: string; demo?: boolean; upgradeMapId?: string; onDelivered: () => void }) {
  const [checkout, setCheckout] = useState(false);
  if (upgradeMapId) return <section className="my-10 flex flex-wrap items-center justify-between gap-6 border border-black/20 bg-[#e6e9dd] p-6 sm:p-8"><div><p className="map-eyebrow">Seu aprofundamento já está disponível</p><h2 className="mt-3 font-editorial text-3xl">Atlas dos Ciclos de Vida</h2></div><Button asChild><a href={`/mapa/${upgradeMapId}`}>Abrir meu Atlas <ArrowUpRight /></a></Button></section>;
  return <section data-analytics-section="upsell-atlas" className="my-10 grid gap-8 border border-black/20 bg-[#e6e9dd] p-6 sm:p-9 lg:grid-cols-[1.25fr_1fr]">
    <div><p className="map-eyebrow text-[#626b51]">Um próximo capítulo / aprofundamento opcional</p><h2 className="mt-4 font-editorial text-4xl leading-tight">Você já conhece seus números.<br /><em className="text-[#737b62]">Explore as grandes fases.</em></h2><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">Seu mapa mostra quem você é por diferentes ângulos. O Atlas dos Ciclos de Vida acrescenta uma linha do tempo simbólica: quatro pináculos para refletir sobre as etapas da sua trajetória.</p><ul className="mt-6 space-y-3 text-sm">{["Quatro pináculos calculados com seu nascimento", "Faixas de idade e destaque para a etapa atual", "Interpretações e um exercício para cada capítulo", "Uma nova leitura online, no mesmo acesso"].map(text => <li key={text} className="flex gap-3"><Check className="size-4 shrink-0" />{text}</li>)}</ul><p className="mt-5 text-xs leading-6 text-muted-foreground">Uma compra separada, sem assinatura. Seu mapa e seus adicionais continuam disponíveis.</p></div>
    <div className="self-center border border-black/20 bg-[#f4f2eb] p-5 sm:p-6"><p className="map-eyebrow">{CATALOG.atlas.name}</p>{checkout ? <div className="mt-5"><PixCheckout product="atlas" sourceMapId={mapId} onDelivered={onDelivered} /></div> : <><p className="mt-4 font-editorial text-5xl">{brl(CATALOG.atlas.price)}</p><p className="mt-2 text-xs text-muted-foreground">Pagamento único via Pix</p>{demo ? <Button asChild className="mt-6 h-auto min-h-12 w-full whitespace-normal"><a href="/mapa/demo?product=atlas">Explorar demonstração do Atlas <ArrowUpRight /></a></Button> : <Button className="mt-6 h-auto min-h-12 w-full whitespace-normal" data-analytics-id="cta-upsell-atlas" onClick={() => { track("upsell_open", { target: "atlas" }); setCheckout(true); }}>Quero aprofundar minha leitura <ArrowUpRight /></Button>}<p className="mt-4 text-xs leading-6 text-muted-foreground">Usaremos os dados do seu mapa. {demo ? "A demonstração usa um perfil fictício." : "O link do Atlas chega ao e-mail da sua compra após a confirmação."}</p></>}</div>
  </section>;
}
