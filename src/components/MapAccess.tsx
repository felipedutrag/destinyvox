"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MapAccess() {
  const [link, setLink] = useState<{ token_hash: string; mapId: string } | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [maps, setMaps] = useState<{ id: string; name: string; title: string }[]>([]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token_hash");
    const mapId = params.get("mapa");
    if (token && mapId) setLink({ token_hash: token, mapId });
    else {
      fetch("/api/maps", { cache: "no-store" }).then(async response => {
        if (response.ok) { const data = await response.json(); setMaps(data.maps || []); }
      }).catch(() => { /* The access form remains available. */ });
    }
    // Keep the secret out of history, referrers and subsequent navigation.
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function enter() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/access/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(link) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/access/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error("Não foi possível solicitar o link agora.");
      const data = await response.json(); setMessage(data.message);
    } catch { setError("Não foi possível conectar. Tente novamente em instantes."); }
    finally { setBusy(false); }
  }

  return <main className="map-theme min-h-screen grid place-items-center p-5">
    <div className="w-full max-w-md">
      <a href="/" className="map-eyebrow mb-10 block text-center">✳ DestinyVox</a>
      <Card className="rounded-sm border-black/15 shadow-none">
        <CardHeader className="p-8 pb-4">
          <span className="map-eyebrow">Seu espaço de autoconhecimento</span>
          <h1 className="font-editorial text-4xl leading-tight">Seu mapa.<br /><em>Seu próprio tempo.</em></h1>
          <p className="pt-3 text-sm leading-7 text-muted-foreground">{link ? "Seu acesso está pronto. Confirme abaixo para abrir sua leitura, sem criar senha." : "Informe o e-mail usado na compra para receber um novo link de acesso."}</p>
        </CardHeader>
        <CardContent className="space-y-6 p-8 pt-3">
          {!link && maps.length > 0 && <nav aria-label="Minhas leituras" className="space-y-3"><p className="map-eyebrow">Suas leituras disponíveis</p>{maps.map(map => <a key={map.id} href={`/mapa/${map.id}`} className="flex items-center justify-between gap-3 rounded-sm border border-black/20 p-4 hover:bg-black/5"><span><span className="block text-sm font-medium">{map.title}</span><span className="mt-1 block text-xs text-muted-foreground">{map.name}</span></span><ArrowRight className="size-4 shrink-0" /></a>)}</nav>}
          {link && <Button className="w-full" onClick={enter} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} Acessar meu mapa</Button>}
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          {(!link || error) && <form onSubmit={requestLink} className="space-y-3">
            <label htmlFor="access-email" className="text-sm">E-mail da compra</label>
            <input id="access-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="w-full rounded-md border border-input bg-background px-3 py-3 text-base focus-visible:outline-2" />
            <Button className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Mail />} Enviar link de acesso</Button>
          </form>}
          {message && <p role="status" className="text-sm leading-6">{message}</p>}
          <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 size-4 shrink-0" />O link é pessoal e de uso único. Sua sessão fica salva neste navegador após entrar.</p>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">Uma leitura para explorar. Um espaço para voltar.</p>
    </div>
  </main>;
}
