"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Copy, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { BUMP_IDS, CATALOG, brl, createOrder, type BumpId, type ProductId } from "@/lib/catalog";
import { trackRedditEvent } from "./RedditPixel";

type Payment = { transaction_id: string; external_id: string; qr_code_base64: string; pix_copy_paste: string; amount_cents: number };
type Phase = "waiting" | "delivering" | "delivered" | "failed" | "paused";

export function PixCheckout({ product = "map", sourceMapId, onDelivered, relationship = false }: { product?: ProductId; sourceMapId?: string; onDelivered?: () => void; relationship?: boolean }) {
  const [customer, setCustomer] = useState({ name: "", email: "", birthDate: "" });
  const [bumps, setBumps] = useState<BumpId[]>(relationship && product === "map" ? ["synastry"] : []);
  const [synastryPerson, setSynastryPerson] = useState({ name: "", birthDate: "" });
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("waiting");
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const purchaseTracked = useRef<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDelivered);
  doneRef.current = onDelivered;
  const storageKey = `destinyvox:pix:${product}:${sourceMapId || (relationship ? "relationship" : "new")}`;
  const order = createOrder(product, bumps);
  const offeredBumps: readonly BumpId[] = relationship ? ["synastry", "calendar", "name", "challenges"] : BUMP_IDS.filter(id => id !== "synastry");

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved?.payment?.transaction_id && saved?.payment?.external_id && Date.now() - saved.savedAt < 86400000) {
        const restored = createOrder(product, saved.bumps);
        if (saved.payment.amount_cents === restored.amountCents) { setBumps(restored.bumps); setPayment(saved.payment); }
      }
    } catch { /* Storage is optional; payment delivery also runs in the webhook. */ }
  }, [storageKey, product]);

  useEffect(() => {
    if (!payment) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let checks = 0;
    const check = async () => {
      try {
        const response = await fetch(`/api/status?id=${encodeURIComponent(payment.transaction_id)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error("Não conseguimos verificar agora. A verificação será repetida automaticamente.");
        if (controller.signal.aborted) return;
        setError("");
        if (data.status === "PAID") {
          if (purchaseTracked.current !== payment.transaction_id) {
            purchaseTracked.current = payment.transaction_id;
            trackRedditEvent("Purchase", { transactionId: payment.transaction_id, value: payment.amount_cents / 100, currency: "BRL" });
          }
          setPhase("delivering");
          const delivery = await fetch("/api/deliver", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: payment.transaction_id, external_id: payment.external_id }), signal: controller.signal });
          const result = await delivery.json();
          if (!delivery.ok || !result.success) throw new Error("Seu pagamento foi confirmado. Estamos tentando enviar seu acesso; você não precisa pagar novamente.");
          if (controller.signal.aborted) return;
          if (result.email_sent) {
            setPhase("delivered");
            try { sessionStorage.removeItem(storageKey); } catch { /* optional */ }
            doneRef.current?.();
            return;
          }
        } else if (["FAILED", "EXPIRED", "CANCELED"].includes(data.status)) { setPhase("failed"); return; }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Não foi possível verificar o pagamento.");
      }
      if (++checks >= 240) { setPhase("paused"); return; }
      timer = setTimeout(check, 5000);
    };
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [payment, attempt, storageKey]);

  useEffect(() => {
    setShowHelp(false);
    if (!payment) return;
    const timer = setTimeout(() => setShowHelp(true), 10000);
    return () => clearTimeout(timer);
  }, [payment]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...customer, product, bumps, sourceMapId, ...(bumps.includes("synastry") ? { synastryPerson } : {}) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Não foi possível gerar o Pix.");
      setPayment(data); setPhase("waiting");
      trackRedditEvent("AddToCart", { value: data.amount_cents / 100, currency: "BRL", itemCount: 1 });
      try { sessionStorage.setItem(storageKey, JSON.stringify({ payment: data, bumps, savedAt: Date.now() })); } catch { /* optional */ }
      requestAnimationFrame(() => { statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); statusRef.current?.focus({ preventScroll: true }); });
    } catch (err) { setError(err instanceof Error ? err.message : "Tente novamente em instantes."); }
    finally { setBusy(false); }
  }

  if (payment) return <div ref={statusRef} tabIndex={-1} className="space-y-5 outline-none">
    <p className="map-eyebrow">{CATALOG[product].name} · {brl(payment.amount_cents)}</p>
    {phase === "delivered" ? <div className="space-y-4 py-5"><Check className="size-8" /><h3 className="font-editorial text-3xl">{product === "synastry_credit" ? "Seu crédito está disponível." : "Sua leitura está a caminho."}</h3><p className="text-sm leading-7 text-muted-foreground">{product === "synastry_credit" ? "Volte à seção de relacionamentos para gerar sua comparação. Enviamos também o acesso por e-mail." : "Enviamos o link para o e-mail da compra. Confira também a caixa de spam."}</p><Button asChild><a href="/acesso"><Mail /> Acessar minhas leituras</a></Button></div>
      : phase === "failed" ? <div className="space-y-4"><h3 className="font-editorial text-3xl">Este Pix não está mais ativo.</h3><p className="text-sm leading-7">Se você já pagou, acesse suas leituras pelo e-mail. Caso contrário, gere um novo código.</p><Button onClick={() => { setPayment(null); setError(""); try { sessionStorage.removeItem(storageKey); } catch { /* optional */ } }}>Voltar ao pedido</Button></div>
      : <><h3 className="font-editorial text-3xl">{phase === "delivering" ? "Pagamento confirmado." : "Seu mapa começa com este Pix."}</h3>
        {phase !== "delivering" && <><p className="text-sm leading-7 text-muted-foreground">Copie o código para pagar no app do seu banco ou escaneie o QR Code. A confirmação aparece aqui automaticamente.</p>
          {/* QR generated by our payment endpoint. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code para pagar seu pedido com Pix" width={220} height={220} className="mx-auto max-w-full border border-black/15 bg-white p-2" />
          <label className="block text-xs">Código Pix copia e cola<textarea readOnly value={payment.pix_copy_paste} onFocus={event => event.target.select()} className="mt-2 h-20 w-full resize-none rounded-sm border border-black/25 bg-white/50 p-3 text-xs" /></label>
          <Button className="w-full" onClick={async () => { try { await navigator.clipboard.writeText(payment.pix_copy_paste); setCopied(true); } catch { setError("Selecione o código acima e copie manualmente."); } }}>{copied ? <Check /> : <Copy />}{copied ? "Código copiado" : "Copiar código Pix"}</Button>
        </>}
        <p role="status" className="flex items-center justify-center gap-2 text-center text-sm"><Loader2 className={`size-4 ${phase !== "paused" ? "animate-spin" : ""}`} />{phase === "delivering" ? "Preparando e enviando sua leitura…" : phase === "paused" ? "A verificação automática foi pausada." : "Aguardando confirmação do pagamento…"}</p>
        {showHelp && phase === "waiting" && <p className="text-center text-sm text-muted-foreground">Precisa de ajuda? <a href="https://wa.me/5513988658518?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20meu%20Pix%20do%20DestinyVox." target="_blank" rel="noreferrer" className="font-medium text-[#343e2a] underline underline-offset-4">Fale conosco pelo WhatsApp</a></p>}
        {phase === "paused" && <Button variant="outline" onClick={() => { setPhase("waiting"); setAttempt(n => n + 1); }}>Já paguei · verificar novamente</Button>}
      </>}
    {error && <p role="alert" className="text-sm leading-6 text-red-800">{error}</p>}
  </div>;

  return <form onSubmit={submit} className="space-y-6">
    {product === "map" && <fieldset disabled={busy} className="space-y-4">
      <legend className="map-eyebrow mb-4">01 / Os dados da sua leitura</legend>
      <label className="block text-sm font-medium" htmlFor="customer-name">Nome completo de nascimento<input id="customer-name" name="name" autoComplete="name" required maxLength={150} value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Como aparece na sua certidão" className="landing-input" /></label>
      <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]"><label className="block min-w-0 text-sm font-medium" htmlFor="customer-email">Seu e-mail<input id="customer-email" name="email" type="email" autoComplete="email" required maxLength={254} value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="Para receber seu mapa" className="landing-input" /></label>
      <label className="block min-w-0 text-sm font-medium" htmlFor="customer-birth">Data de nascimento<input id="customer-birth" name="birthDate" type="date" autoComplete="bday" required min="1900-01-01" value={customer.birthDate} onChange={e => setCustomer({ ...customer, birthDate: e.target.value })} className="landing-input" /></label></div>
      <p className="text-xs leading-5 text-muted-foreground">Nome e nascimento entram nos cálculos. Seu e-mail recebe o link de acesso.</p>
    </fieldset>}
    {product === "map" && <fieldset disabled={busy} className="space-y-3">
      <legend className="map-eyebrow mb-1">02 / Quer aprofundar algum tema?</legend>
      <p className="pb-2 text-xs leading-5 text-muted-foreground">Adicionais opcionais. Seu mapa de nove números já está completo sem eles.</p>
      {offeredBumps.map(id => <div key={id} className={`rounded-sm border p-4 transition-colors ${bumps.includes(id) ? "border-[#656e50] bg-[#e6e9dd]" : "border-black/15 hover:bg-black/[.025]"}`}>
        <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name={`bump-${id}`} checked={bumps.includes(id)} onChange={e => setBumps(current => e.target.checked ? [...current, id] : current.filter(bump => bump !== id))} className="mt-1 size-4 shrink-0 accent-[#343e2a]" />
        <span className="min-w-0"><span className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm font-semibold"><span>{CATALOG[id].name}</span><span className="whitespace-nowrap">+ {brl(CATALOG[id].price)}</span></span><span className="mt-2 block text-xs leading-6 text-muted-foreground">{CATALOG[id].description}</span></span>
        </label>
        {id === "synastry" && bumps.includes("synastry") && <div className="mt-4 space-y-4 border-t border-black/15 pt-4">
          <label htmlFor="crush-name" className="block text-sm font-medium">Nome completo de nascimento do crush<input id="crush-name" name="crushName" autoComplete="off" required maxLength={150} value={synastryPerson.name} onChange={e => setSynastryPerson({ ...synastryPerson, name: e.target.value })} placeholder="Nome completo, como na certidão" className="landing-input" /></label>
          <label htmlFor="crush-birth" className="block text-sm font-medium">Data de nascimento do crush<input id="crush-birth" name="crushBirthDate" type="date" autoComplete="off" required min="1900-01-01" value={synastryPerson.birthDate} onChange={e => setSynastryPerson({ ...synastryPerson, birthDate: e.target.value })} className="landing-input" /></label>
          <p className="text-xs leading-6 text-muted-foreground">Após o Pix, seu mapa e a sinastria serão preparados juntos. Este adicional custa R$ 9,90; desmarque acima se quiser apenas o mapa.</p>
        </div>}
      </div>)}
    </fieldset>}
    <div className="space-y-3 border-t border-black/20 pt-5" aria-live="polite">
      <div className="flex justify-between gap-3 text-sm"><span>{CATALOG[product].name}</span><span className="whitespace-nowrap">{brl(CATALOG[product].price)}</span></div>
      {bumps.map(id => <div key={id} className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{CATALOG[id].name}</span><span className="whitespace-nowrap">{brl(CATALOG[id].price)}</span></div>)}
      <div className="flex items-baseline justify-between border-t border-black/10 pt-3"><span className="text-sm font-semibold">Total · pagamento único</span><strong className="font-editorial text-3xl font-normal">{brl(order.amountCents)}</strong></div>
    </div>
    {error && <p role="alert" className="text-sm leading-6 text-red-800">{error}</p>}
    <Button type="submit" disabled={busy} className="h-auto min-h-14 w-full whitespace-normal rounded-sm bg-[#343e2a] px-4 text-base text-white hover:bg-[#455138]">{busy ? <><Loader2 className="animate-spin" /> Gerando seu Pix…</> : <>{product === "synastry_credit" ? "Comprar meu crédito de sinastria" : product === "atlas" ? "Quero meu Atlas" : relationship ? "Quero descobrir meu jeito de amar" : "Quero descobrir meus números"} <ArrowRight /></>}</Button>
    <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Lock className="size-3 shrink-0" /> Pix · Sem assinatura · Acesso por e-mail</p>
  </form>;
}
