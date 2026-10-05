"use client";
import { useCallback, useEffect, useState, type ReactNode, type FormEvent } from "react";
import type { AnalyticsReport } from "@/lib/analytics-report";
import { brl } from "@/lib/catalog";
import styles from "./analytics.module.css";
type Report = AnalyticsReport & { start: string; end: string; truncated: boolean; unattributedPaid: number };
const labels: Record<string, string> = { "section-1": "Abertura / promessa", "section-3": "Como funciona", "section-5": "Perguntas frequentes", "leitura": "Benefícios", "seu-mapa": "Oferta e formulário", "bump-calendar": "Oferta calendário", "bump-challenges": "Oferta desafios", "upsell-atlas": "Oferta Atlas", calendar: "Calendário", challenges: "Quatro desafios", synastry: "Sinastria", name: "Forças do nome", click: "Clique", faq_open: "Abriu conteúdo / FAQ", field_focus: "Entrou no campo", field_complete: "Preencheu campo", field_invalid: "Campo inválido", bump_toggle: "Alterou adicional", checkout_error: "Falha no checkout", pix_copy: "Copiou Pix", upsell_open: "Abriu checkout Atlas", client_error: "Erro de página" };
const label = (key: string) => ({ hero: "Abertura / promessa", "como-funciona": "Como funciona", faq: "Perguntas frequentes", "cta-hero": "CTA da abertura", "cta-beneficios": "CTA após benefícios", "submit-map": "Gerar Pix do mapa", "beneficio-01": "Benefício 1", "beneficio-02": "Benefício 2", "beneficio-03": "Benefício 3", "beneficio-04": "Benefício 4" }[key] || labels[key] || key || "—");
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const targetLabel = (event: string, target: string) => event.startsWith("field_") ? ({ name: "Nome de nascimento", email: "E-mail", birthDate: "Nascimento", crushName: "Nome do crush", crushBirthDate: "Nascimento do crush" }[target] || target) : label(target);
function Table({ headings, rows }: { headings: string[]; rows: ReactNode[][] }) {
  return <div className={styles.scroll}><table><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>) : <tr><td colSpan={headings.length}>Ainda não há dados neste recorte.</td></tr>}</tbody></table></div>;
}
function download(report: Report) {
  const rows = [["sessao", "visitante", "inicio", "origem", "campanha", "dispositivo", "pagina", "segundos_ativos", "scroll_percentual", "ultima_secao", "compra"], ...report.sessions.map(s => [s.id, s.visitorId || "", s.started, s.source, s.campaign, s.device, s.path, String(s.seconds), String(s.depth), s.lastSection, s.paid ? "sim" : "nao"])];
  const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "destinyvox-sessoes.csv"; a.click(); URL.revokeObjectURL(url);
}
export function AnalyticsDashboard() {
  const [report, setReport] = useState<Report | null>(null), [login, setLogin] = useState(false), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ days: "7", source: "", campaign: "", device: "", path: "", version: "" });
  const [tab, setTab] = useState("Visão geral");
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/analytics/report?${new URLSearchParams(filters)}`, { cache: "no-store", signal });
      if (response.status === 401) { setLogin(true); setReport(null); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setLogin(false); setReport(body);
    } catch (e) { if (!signal?.aborted) { setReport(null); setError(e instanceof Error ? e.message : "Falha na consulta."); } }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [filters]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/analytics/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setPassword(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível entrar."); } finally { setBusy(false); }
  }
  const select = (key: keyof typeof filters, title: string, options: [string, string][]) => <label>{title}<select value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}>{options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>;
  if (login) return <main className={styles.root}><form className={styles.login} onSubmit={signIn}><p className={styles.eyebrow}>DESTINYVOX / ANALYTICS</p><h1>Entenda cada passo.</h1><p>Painel privado de comportamento e vendas.</p><label>Senha administrativa<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button disabled={busy}>{busy ? "Entrando…" : "Entrar no painel"}</button>{error && <p role="alert" className={styles.error}>{error}</p>}</form></main>;
  return <main className={styles.root}>
    <header className={styles.header}><div><p className={styles.eyebrow}>DESTINYVOX / INTELIGÊNCIA DE CONVERSÃO</p><h1>Da primeira leitura à compra.</h1><p>Descubra onde a copy desperta interesse e onde a jornada para.</p></div><div className={styles.actions}><button onClick={() => void load()} disabled={busy}>{busy ? "Atualizando…" : "Atualizar dados"}</button><button className={styles.secondary} onClick={async () => { const res = await fetch("/api/analytics/auth", { method: "DELETE" }); if (res.ok) { setReport(null); setLogin(true); } else setError("Não foi possível sair."); }}>Sair</button></div></header>
    <div className={styles.filters}>
      {select("days", "Período móvel", [["1", "Últimas 24 horas"], ["7", "Últimos 7 dias"], ["14", "Últimos 14 dias"], ["30", "Últimos 30 dias"]])}
      {select("source", "Origem", [["", "Todas"], ...(report?.options.sources || []).map(v => [v, v] as [string, string])])}
      {select("campaign", "Campanha", [["", "Todas"], ...(report?.options.campaigns || []).map(v => [v, v] as [string, string])])}
      {select("device", "Dispositivo", [["", "Todos"], ["mobile", "Celular"], ["tablet", "Tablet"], ["desktop", "Computador"]])}
      {select("path", "Entrada da sessão", [["", "Todas as páginas"], ["/", "Landing principal"], ["/sinastria", "Landing sinastria"], ["/mapa/:id", "Mapa / pós-compra"], ["/acesso", "Acesso"], ["/mapa/demo", "Demonstração"]])}
      {select("version", "Versão da copy", [["", "Todas"], ...(report?.options.versions || []).map(v => [v, v] as [string, string])])}
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!report && !error && <p role="status">Carregando painel…</p>}
    {report && <>
      <p className={styles.note}>Atualizado em {date(report.end)} · Horário de Brasília · Sessões observadas no período; pagamentos atribuídos a essas sessões pelo momento de criação do pedido.</p>
      {report.truncated && <p className={styles.error}>Resultado parcial: o limite de 50 mil eventos ou 10 mil pedidos foi atingido. Reduza o período antes de interpretar as taxas.</p>}
      {!!report.unattributedPaid && <p className={styles.note}>{report.unattributedPaid} pagamentos confirmados sem sessão observada neste período ficaram fora das métricas abaixo.</p>}
      <div className={styles.metrics}>{[["Visitantes únicos", report.visitorStats.unique], ["Novos no período", report.visitorStats.new], ["Já visitavam antes", report.visitorStats.returning], ["Sessões por visitante", report.visitorStats.sessionsPerVisitor]].map(([name, value]) => <article key={name}><span>{name}</span><strong>{value}</strong></article>)}</div>
      <p className={styles.note}>Visitantes representam navegadores, não pessoas identificadas. Novos = primeira visita observada dentro do período; recorrentes = primeira visita anterior ao período. {report.visitorStats.unidentifiedSessions} sessões sem ID persistente ficam fora dessa contagem. {report.visitorStats.unknown > 0 ? `${report.visitorStats.unknown} visitantes sem histórico de primeira visita.` : ""}</p>
      <div className={styles.metrics}>{[["Sessões", report.totals.sessions], ["Compras confirmadas", report.totals.orders], ["Sessões com compra", `${report.totals.conversion}%`], ["Receita atribuída", brl(report.totals.revenue)], ["Ticket por pedido", brl(report.totals.averageOrder)], ["Tempo ativo médio", `${report.totals.activeSeconds}s`], ["Receita por sessão", brl(report.totals.revenuePerSession)], ["Pix gerados", report.totals.pix]].map(([name, value]) => <article key={name}><span>{name}</span><strong>{value}</strong></article>)}</div>
      <nav className={styles.tabs} aria-label="Relatórios">{["Visão geral", "Copy e seções", "Ofertas", "Campanhas", "Visitantes", "Sessões"].map(name => <button key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</nav>
      {tab === "Visitantes" && <section className={styles.panel}><h2>Visitantes e retornos</h2><p>Últimos 100 visitantes do recorte. Sessões e tempo respeitam os filtros; a primeira visita considera o histórico global desse navegador.</p><Table headings={["Visitante", "Primeira visita", "Perfil no período", "Sessões", "Tempo ativo", "IDs das sessões"]} rows={report.visitors.map(v => [<span title={v.id}>{v.id.slice(0, 8)}</span>, v.firstSeen ? date(v.firstSeen) : "Sem histórico", v.kind === "new" ? "Novo" : v.kind === "returning" ? "Recorrente" : "Desconhecido", v.sessions, `${v.seconds}s`, v.sessionIds.map(id => id.slice(0, 8)).join(", ")])} /></section>}
      {tab === "Visão geral" && <div className={styles.grid}>
        <section className={styles.panel}><h2>Funil da landing</h2><p>Visitantes únicos por etapa, com passos em ordem na mesma sessão. Taxa relativa à etapa anterior.</p>{report.funnel.map((step, i) => <div className={styles.funnel} key={step.label}><div><span>{step.label}</span><strong>{step.count}</strong></div><div className={styles.track}><span style={{ width: `${report.funnel[0].count ? step.count / report.funnel[0].count * 100 : 0}%` }} /></div><small>{i ? `${step.rate}% avançaram · ${step.lost} visitantes não chegaram à etapa` : "Visitantes únicos com entrada em uma das landings"}</small></div>)}<p className={styles.note}>Cada visitante conta uma vez por etapa no recorte, mesmo que volte em outras sessões. Passos de sessões diferentes não são somados. {report.funnelUnidentifiedSessions} sessões de landing sem identificação válida ficam fora do funil. Saltos de etapa e eventos bloqueados podem deixar compradores fora deste funil estrito. O total de compras acima vem do banco e conta pedidos, não visitantes.</p></section>
        <section className={styles.panel}><h2>Tráfego e vendas por dia</h2><p>Dia de entrada da sessão em Brasília.</p><div className={styles.chart}>{report.daily.map(d => <div key={d.day} title={`${d.day}: ${d.sessions} sessões, ${d.orders} compras`}><span>{d.sessions}</span><i style={{ height: `${Math.max(4, d.sessions / Math.max(1, ...report.daily.map(v => v.sessions)) * 120)}px` }} /><small>{d.day.slice(5)}</small></div>)}</div><Table headings={["Dia", "Sessões", "Compras", "Receita"]} rows={report.daily.map(d => [d.day, d.sessions, d.orders, brl(d.revenue)])} /><p className={styles.note}>Carregamento principal (LCP, p75): {report.totals.lcpP75 ? `${(report.totals.lcpP75 / 1000).toFixed(1)}s` : "sem amostra"} · {report.totals.pageViews} visualizações de página.</p></section>
      </div>}
      {tab === "Copy e seções" && <>
        <section className={styles.panel}><h2>Até onde a mensagem chegou?</h2><p>Tempo indica exposição ativa, não prova de leitura. “Última seção” é uma saída estimada após 30 minutos sem eventos.</p><Table headings={["Página / seção", "Sessões expostas", "Alcance¹", "Tempo médio", "Última seção", "Compradores expostos"]} rows={report.sections.map(s => [<><small>{s.path}</small><br />{label(s.section)}</>, s.views, `${s.reach}%`, `${s.seconds}s`, s.exits, s.buyers])} /><p className={styles.note}>¹ Percentual de todas as sessões do recorte. Exposição e compra são associação; não demonstram que a seção causou a venda.</p></section>
        <section className={styles.panel}><h2>Cliques, dúvidas e atrito</h2><p>Compare CTAs, perguntas abertas, campos abandonados e erros. Nenhum conteúdo digitado é coletado.</p><Table headings={["Ação", "Página / seção", "Elemento", "Sessões", "Ocorrências"]} rows={report.interactions.map(i => [label(i.event), `${i.path} / ${label(i.section)}`, targetLabel(i.event, i.target), i.sessions, i.count])} /></section>
      </>}
      {tab === "Ofertas" && <>
        <section className={styles.panel}><h2>Order bumps</h2><p>Aceitação = pedidos principais pagos com o adicional ÷ pedidos principais pagos. Seleção é interesse, não compra.</p><Table headings={["Adicional", "Sessões expostas", "Marcaram ao menos 1 vez", "Pedidos pagos", "Aceitação"]} rows={report.bumps.map(b => [label(b.id), b.viewed, b.selected, b.paid, `${b.acceptance}%`])} /><p className={styles.note}>Um adicional pré-selecionado pode ser comprado sem gerar evento de marcação.</p></section>
        <section className={styles.panel}><h2>Upsell · Atlas dos Ciclos</h2><Table headings={["Sessões expostas", "Abriram checkout", "Pedidos pagos", "Receita"]} rows={[[report.upsell.views, report.upsell.opens, report.upsell.orders, brl(report.upsell.revenue)]]} /><p className={styles.note}>O upsell pode ocorrer em outra sessão. O ticket mostrado é por pedido, não receita vitalícia por cliente.</p></section>
      </>}
      {tab === "Campanhas" && <section className={styles.panel}><h2>Qual anúncio trouxe compradores?</h2><p>Use utm_source, utm_medium, utm_campaign e utm_content nos anúncios. A atribuição é a origem no início de cada sessão.</p><Table headings={["Origem", "Campanha", "Criativo / conteúdo", "Sessões", "Sessões com compra", "Receita"]} rows={report.sources.map(s => [s.source || "direct", s.campaign || "—", s.content || "—", s.sessions, s.buyers, brl(s.revenue)])} /><p className={styles.note}>Exemplo: /?utm_source=reddit&amp;utm_medium=paid_social&amp;utm_campaign=mapa&amp;utm_content=imagem_01</p></section>}
      {tab === "Sessões" && <section className={styles.panel}><div className={styles.header}><div><h2>Jornadas individuais</h2><p>Últimas 100 sessões do recorte. Identificadores aleatórios, sem identificação pessoal.</p></div><button onClick={() => download(report)}>Exportar estas sessões</button></div>{report.sessions.map(s => <details className={styles.session} key={s.id}><summary><strong>{s.id.slice(0, 8)}</strong> · {date(s.started)} · {s.source} · {s.seconds}s ativos · {s.depth}% scroll · {s.paid ? "Comprou" : "Sem compra observada"}</summary><p>Visitante: {s.visitorId?.slice(0, 8) || "Sem ID persistente"} · {s.device} · Entrada: {s.path} · Última seção: {label(s.lastSection)} · {s.ended ? "Encerrada por inatividade" : "Recente / pode estar em andamento"}</p><Table headings={["Horário", "Evento", "Seção", "Elemento", "Valor"]} rows={s.timeline.map(e => [date(e.time), label(e.event), label(e.section), targetLabel(e.event, e.target), e.value || "—"])} /></details>)}{!report.sessions.length && <p>Nenhuma sessão registrada neste recorte.</p>}</section>}
      <footer className={styles.note}>Sessões expiram após 30 minutos sem atividade. Bloqueadores, preferência de privacidade e perda de conexão podem reduzir a amostra. Não há gravação de tela nem captura de valores dos formulários.</footer>
    </>}
  </main>;
}
