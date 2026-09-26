"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, LoaderCircle, Sparkles } from "lucide-react";
import type { NumerologyContent, NumerologyPillarData } from "@/lib/delivery";
import { trackFunnelEvent } from "@/lib/funnelAnalytics";
import { trackRedditPurchase } from "@/lib/redditPixel";
import { formatBirthDateUS } from "@/utils/numerology";
import { BrandLogo } from "@/components/BrandLogo";

type ReadingResponse = { status: "ready"; mapId: string; name: string; birthDate: string; content: NumerologyContent; amount: number | null; currency: string };
type Stage = "loading" | "ready" | "reading" | "error";

const PILLARS: Array<[keyof NumerologyContent["pillars"], string, string]> = [
  ["lifePath", "Life Path", "The direction and lessons highlighted by your birth date."],
  ["expression", "Expression", "The abilities and ways of expressing yourself reflected in your name."],
  ["soulUrge", "Soul Urge", "The inner motivations represented by the vowels in your name."],
  ["personality", "Personality", "The first impression and qualities others may notice."],
  ["personalYear", "Personal Year", "The themes associated with your current annual cycle."],
  ["birthday", "Birthday", "A focused strength associated with your day of birth."],
  ["maturity", "Maturity", "A pattern that combines your Life Path and Expression numbers."],
  ["attitude", "Attitude", "The approach suggested by your month and day of birth."],
];

function PillarCard({ pillar, defaultOpen = false }: { pillar: NumerologyPillarData; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-white/10 bg-white/[0.025]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="font-editorial text-4xl text-amber-200">{pillar.number}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] tracking-[0.15em] text-amber-100/75">{pillar.label.toUpperCase()}</span>
          <span className="mt-1 block font-editorial text-xl text-white">{pillar.archetype}</span>
        </span>
        <span className="font-mono text-xs text-[#837d72] transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-white/[0.07] px-5 py-5 sm:px-6">
        {pillar.keywords && <p className="font-mono text-[10px] tracking-wide text-amber-100/75">{pillar.keywords}</p>}
        {pillar.paragraphs.map((paragraph, index) => <p key={index} className="font-mono text-xs leading-6 text-[#c2bcb1] sm:text-sm">{paragraph}</p>)}
        {pillar.dictum && <p className="border-l border-amber-200/40 pl-4 font-editorial text-lg italic text-white/90">{pillar.dictum}</p>}
      </div>
    </details>
  );
}

export function ReadingExperience() {
  const [stage, setStage] = useState<Stage>("loading");
  const [reading, setReading] = useState<ReadingResponse | null>(null);
  const [error, setError] = useState("We couldn’t find a reading for this checkout.");
  const [downloading, setDownloading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const loadReading = useCallback(async (forceRetry = false) => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) {
      setError("This page needs the secure link from your checkout confirmation.");
      setStage("error");
      return;
    }
    setSessionId(id);
    setStage("loading");
    setError("We couldn’t find a reading for this checkout.");

    let shouldForceRetry = forceRetry;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const retryQuery = shouldForceRetry ? "&retry=1" : "";
        shouldForceRetry = false;
        const response = await fetch(`/api/deliver?session_id=${encodeURIComponent(id)}${retryQuery}`, { cache: "no-store" });
        if (response.status === 202) {
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
          continue;
        }
        const data = await response.json();
        if (!response.ok || data.status !== "ready") {
          setError(data.error || "Unable to load your reading.");
          setStage("error");
          return;
        }
        const result = data as ReadingResponse;
        setReading(result);
        setStage("ready");
        const purchaseValue = result.amount ?? 27;
        const purchaseCurrency = result.currency.toUpperCase();
        trackFunnelEvent("purchase_completed", { value: purchaseValue, currency: purchaseCurrency, transaction_id: id });
        try {
          const key = `destinyvox_purchase_${id}`;
          if (!sessionStorage.getItem(key)) {
            trackRedditPurchase({ value: purchaseValue, currency: purchaseCurrency, plan: "complete_numerology_reading" });
            sessionStorage.setItem(key, "1");
          }
        } catch {
          trackRedditPurchase({ value: purchaseValue, currency: purchaseCurrency, plan: "complete_numerology_reading" });
        }
        return;
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }
    }
    setError("Your payment is confirmed, but the reading is taking longer than expected. Please try again in a moment.");
    setStage("error");
  }, []);

  useEffect(() => { void loadReading(); }, [loadReading]);

  const openReading = () => {
    if (reading) trackFunnelEvent("full_reading_opened", { map_id: reading.mapId });
    setStage("reading");
  };

  const downloadPdf = async () => {
    if (!sessionId || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/deliver?session_id=${encodeURIComponent(sessionId)}&format=pdf`, { cache: "no-store" });
      if (!response.ok) throw new Error("Your PDF couldn’t be downloaded right now.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "DestinyVox-Personal-Reading.pdf";
      link.click();
      URL.revokeObjectURL(objectUrl);
      if (reading) trackFunnelEvent("pdf_downloaded", { map_id: reading.mapId });
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Your PDF couldn’t be downloaded right now.");
    } finally {
      setDownloading(false);
    }
  };

  const firstName = reading?.name.split(/\s+/)[0] || "";

  return (
    <div className="min-h-[100svh] bg-[#0a0908] text-[#f6f2eb]">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-6 sm:px-8">
        <BrandLogo />
        {(stage === "reading" || stage === "ready") && reading && <button onClick={downloadPdf} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] tracking-wide text-amber-100 hover:border-amber-200/40 disabled:opacity-50"><Download className="h-3.5 w-3.5" />{downloading ? "PREPARING PDF" : "DOWNLOAD PDF"}</button>}
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        {stage === "loading" && <section className="mx-auto flex max-w-lg flex-col items-center py-24 text-center" aria-live="polite"><LoaderCircle className="mb-6 h-8 w-8 animate-spin text-amber-200" /><h1 className="font-editorial text-3xl text-white">Preparing your personal reading</h1><p className="mt-3 font-mono text-xs leading-6 text-[#aaa397]">Your payment is confirmed. We’re finishing your personalized report now.</p></section>}

        {stage === "error" && <section className="mx-auto max-w-lg py-20 text-center"><Sparkles className="mx-auto mb-5 h-6 w-6 text-amber-200" /><h1 className="font-editorial text-3xl text-white">Your reading is almost ready</h1><p className="mt-4 font-mono text-sm leading-6 text-[#aaa397]">{error}</p><button onClick={() => void loadReading(true)} className="mt-7 min-h-12 rounded-xl bg-amber-300 px-6 font-mono text-xs font-bold tracking-wide text-[#15120d]">TRY AGAIN</button></section>}

        {stage === "ready" && reading && <section className="journey-enter mx-auto max-w-2xl py-16 text-center"><Sparkles className="mx-auto mb-6 h-7 w-7 text-amber-200" /><p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80">YOUR PERSONAL READING IS READY</p><h1 className="mt-4 font-editorial text-4xl text-white sm:text-5xl">Made for {firstName}.</h1><p className="mx-auto mt-5 max-w-lg font-mono text-sm leading-7 text-[#b6b0a5]">Your complete numerology profile is ready to explore. You can read it here or download your personalized PDF to keep.</p><button onClick={openReading} className="mt-8 min-h-14 rounded-xl bg-amber-300 px-7 font-mono text-xs font-bold tracking-[0.12em] text-[#15120d]">EXPLORE MY READING</button><p className="mt-4 font-mono text-[10px] text-[#777064]">One-time purchase · Your PDF is included</p></section>}

        {stage === "reading" && reading && <article className="journey-enter">
          <section className="mb-12 border-b border-white/10 pb-10"><p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80">YOUR PERSONAL NUMEROLOGY READING</p><h1 className="mt-4 font-editorial text-4xl leading-tight text-white sm:text-6xl">The patterns in your numbers, {firstName}.</h1><p className="mt-4 font-mono text-xs text-[#837d72]">Prepared for {reading.name} · {formatBirthDateUS(reading.birthDate)}</p></section>

          <section><div className="mb-5"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">YOUR CORE PROFILE</p><h2 className="mt-2 font-editorial text-3xl text-white">Eight numbers, one personal map.</h2><p className="mt-2 max-w-2xl font-mono text-xs leading-6 text-[#aaa397]">Explore each number to read its place in your profile.</p></div><div className="space-y-3">{PILLARS.map(([key]) => { const pillar = reading.content.pillars[key]; return <PillarCard key={key} pillar={pillar} defaultOpen={key === "lifePath"} />; })}</div></section>

          <section className="mt-14"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">YOUR NUMBERS IN EVERYDAY LIFE</p><h2 className="mt-2 font-editorial text-3xl text-white">Relationships, work & purpose</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="font-editorial text-2xl text-white">Relationships & connection</h3><p className="mt-3 font-mono text-xs leading-6 text-[#aaa397]">Your inner motivations and the qualities you show socially offer two complementary lenses on how you connect.</p><p className="mt-4 font-mono text-xs leading-6 text-[#d1cabe]">Soul Urge {reading.content.pillars.soulUrge.number} ({reading.content.pillars.soulUrge.archetype}) reflects themes of {reading.content.pillars.soulUrge.keywords.toLowerCase()}. Personality {reading.content.pillars.personality.number} ({reading.content.pillars.personality.archetype}) adds themes of {reading.content.pillars.personality.keywords.toLowerCase()} to reflect on in communication and first impressions.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="font-editorial text-2xl text-white">Work & purpose</h3><p className="mt-3 font-mono text-xs leading-6 text-[#aaa397]">Your abilities and broader direction come together as you consider where your contribution feels meaningful.</p><p className="mt-4 font-mono text-xs leading-6 text-[#d1cabe]">Expression {reading.content.pillars.expression.number} ({reading.content.pillars.expression.archetype}) highlights themes of {reading.content.pillars.expression.keywords.toLowerCase()}. Life Path {reading.content.pillars.lifePath.number} ({reading.content.pillars.lifePath.archetype}) adds themes of {reading.content.pillars.lifePath.keywords.toLowerCase()} to your longer-term reflection.</p></div>
          </div></section>

          <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">PATTERNS TO NOTICE</p><h2 className="mt-2 font-editorial text-3xl text-white">Challenges & growth</h2><p className="mt-2 font-mono text-xs leading-6 text-[#aaa397]">A reflective look at recurring challenges associated with your profile.</p><div className="mt-6 space-y-4">{reading.content.shadow.paragraphs.map((paragraph, index) => <p key={index} className="font-mono text-xs leading-6 text-[#c2bcb1] sm:text-sm">{paragraph}</p>)}{reading.content.shadow.transmutation.map((paragraph, index) => <p key={`t-${index}`} className="border-l border-amber-200/40 pl-4 font-mono text-xs leading-6 text-amber-100/85 sm:text-sm">{paragraph}</p>)}</div></section>

          <section className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-100/[0.035] p-5 sm:p-7"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">A PERSONAL REMINDER</p><h2 className="mt-2 font-editorial text-3xl text-white">Your activation</h2><p className="mt-5 font-mono text-xs leading-6 text-[#ded8cd] sm:text-sm">{reading.content.activation.abundanceCode}</p><p className="mt-5 border-l border-amber-200/40 pl-4 font-editorial text-lg italic leading-7 text-amber-100">{reading.content.activation.manifestationDecree}</p></section>

          {reading.content.orderBumps?.personalYearMonths?.active && <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">MONTH BY MONTH</p><h2 className="mt-2 font-editorial text-3xl text-white">Your personal year cycle</h2><p className="mt-4 font-mono text-xs leading-6 text-[#c2bcb1]">{reading.content.orderBumps.personalYearMonths.executiveAdvice}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{reading.content.orderBumps.personalYearMonths.months.map((month) => <div key={month.monthIndex} className="rounded-xl border border-white/[0.07] p-4"><p className="font-mono text-[10px] tracking-wide text-amber-100/80">{month.monthName.toUpperCase()} · {month.personalMonthNumber}</p><p className="mt-1 font-editorial text-lg text-white">{month.theme}</p><p className="mt-2 font-mono text-[11px] leading-5 text-[#aaa397]">{month.guidance}</p></div>)}</div></section>}

          {reading.content.orderBumps?.karmicDebt?.active && <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80">ADDITIONAL REFLECTION</p><h2 className="mt-2 font-editorial text-3xl text-white">Karmic themes</h2><p className="mt-4 font-mono text-xs leading-6 text-[#c2bcb1]">{reading.content.orderBumps.karmicDebt.statusText}</p>{reading.content.orderBumps.karmicDebt.items.map((item) => <div key={item.number} className="mt-5 border-t border-white/10 pt-4"><h3 className="font-editorial text-xl text-white">{item.number} · {item.title}</h3><p className="mt-2 font-mono text-xs leading-6 text-[#aaa397]">{item.diagnosis}</p><p className="mt-2 font-mono text-xs leading-6 text-amber-100/80">{item.protocol}</p></div>)}</section>}

          <div className="mt-10 text-center"><button onClick={downloadPdf} disabled={downloading} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-amber-300 px-7 font-mono text-xs font-bold tracking-[0.1em] text-[#15120d] disabled:opacity-50"><Download className="h-4 w-4" />{downloading ? "PREPARING PDF..." : "DOWNLOAD MY PERSONAL PDF"}</button><p className="mt-3 font-mono text-[10px] text-[#777064]">A copy of this reading, ready to keep.</p></div>
        </article>}
      </main>
    </div>
  );
}
