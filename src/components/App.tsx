"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Loader2,
  Zap,
  BookOpen,
  Compass,
  Flame,
  User,
  AlertTriangle,
  Calendar,
  Gift,
  Award,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  trackRedditInitiateCheckout,
  trackRedditPurchase,
} from "@/lib/redditPixel";

type Language = "en";

const TRANSLATIONS = {
  en: {
    badge: "PYTHAGOREAN DESTINY DOSSIER",
    badgeDesktop: "HERMETIC NUMEROLOGY & CONSCIOUSNESS ENGINEERING",
    subBrand: "DESTINY MAP",
    navCta: "ACCESS MY MAP 🔮",
    heroTitleLine1: "Decode the Hidden Algorithm",
    heroTitleLine2: "of your Own Destiny.",
    heroDescription:
      "Your birth name and date of birth contain the exact mathematical blueprint of your soul. Access your Complete Pythagorean Dossier in PDF (11 Dedicated Pages): the ancient science of Gematria and the profound revelation of your 7 Vibrational Pillars with strategic guidance.",
    ctaMain: "GENERATE MY PYTHAGOREAN MAP",
    ctaSub: "Complete High-Resolution PDF Dossier — Immediate Delivery",
    featureTag: "7 VIBRATIONAL PILLARS CALCULATED",
    howItWorksTitle: "THE SCIENCE OF THE PYTHAGOREAN MATRIX",
    howItWorksHeading: "Exact engineering based on your birth certificate and birth date",
    howItWorksDesc:
      "Unlike generic horoscopes or shallow predictions, the DestinyVox Method decodes each phoneme of your full name and each digit of your birth date according to the Pythagorean Table and Hermetic Laws of Correspondence:",
    numbersList: [
      {
        icon: Compass,
        num: "01",
        name: "LIFE PATH (CENTRAL DESTINY)",
        desc: "The mission you came to fulfill and the main obstacles on your journey.",
      },
      {
        icon: User,
        num: "02",
        name: "SOUL URGE (INNER DESIRE)",
        desc: "What your spirit truly seeks behind all your worldly actions.",
      },
      {
        icon: Flame,
        num: "03",
        name: "EXPRESSION (NATURAL TALENTS)",
        desc: "The unique skills and energetic signature you project into the world.",
      },
      {
        icon: AlertTriangle,
        num: "04",
        name: "KARMIC DEBTS",
        desc: "Unresolved cycles from past lives that block your current prosperity.",
      },
      {
        icon: Award,
        num: "05",
        name: "PERSONAL YEAR 2026",
        desc: "The specific vibration of this year and when to act (or retreat).",
      },
    ],
    pricingTitle: "UNLOCK YOUR ALGORITHMIC BLUEPRINT",
    pricingTag: "SPECIAL OFFER",
    pricingHeading: "Secure your Pythagorean Dossier today",
    pricingDesc: "Immediate access to your 11-page personalized PDF dossier.",
    pricingCardTitle: "Pythagorean Dossier",
    pricingPrice: "$19.90",
    pricingOriginalPrice: "$49.90",
    pricingFeatures: [
      "11-Page Personalized PDF Map",
      "Analysis of your 7 Vibrational Pillars",
      "Identification of Hidden Talents",
      "Calculation of your Life Path",
      "Immediate Delivery to Email"
    ],
    pricingCta: "UNLOCK MY DOSSIER NOW",
    footerStripe: "Secure Instant Payment",
    footerGuarantee: "7-Day Unconditional Guarantee",
    footerSync: "Instant Email Delivery",
    footerCopyright: "DESTINYVOX © 2026 — PYTHAGOREAN CONSCIOUSNESS ENGINEERING.",
  }
};

export function App() {
  const [lang, setLang] = useState<Language>("en");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Formulário integrado no Card de Preço (SEM MODAL)
  const isDev = process.env.NODE_ENV !== "production";
  const [pixStep, setPixStep] = useState<"FORM" | "QR_CODE" | "PAID" | "DELIVERED">("FORM");
  const [pixForm, setPixForm] = useState({
    name: isDev ? "Felipe Dutra Gonçalves" : "",
    email: isDev ? "felipedutra@outlook.com" : "",
    birthDate: isDev ? "04/10/1991" : "",
  });

  // 2 Order Bumps: Dívida Kármica e Ano Pessoal 2026
  const [orderBumps, setOrderBumps] = useState({
    karmicDebt: false,
    personalYearMonths: false,
  });

  const [pixLoading, setPixLoading] = useState<boolean>(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    transaction_id: string;
    qr_code_base64: string;
    pix_copy_paste: string;
    external_id: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const trackedPurchasesRef = useRef<Set<string>>(new Set());

  // Preços
  const basePrice = 19.90;
  const karmicPrice = 9.90;
  const personalYearPrice = 9.90;

  const currentTotal =
    basePrice +
    (orderBumps.karmicDebt ? karmicPrice : 0) +
    (orderBumps.personalYearMonths ? personalYearPrice : 0);

  const displayTotal = `${currentTotal.toFixed(2)}`;

  const triggerRedditPurchase = (transactionId: string, externalId?: string) => {
    const key = transactionId || externalId || `PIX_PAID_${Date.now()}`;
    if (trackedPurchasesRef.current.has(key)) return;
    trackedPurchasesRef.current.add(key);

    const priceValue = isDev ? 1.0 : currentTotal;
    trackRedditPurchase({
      value: priceValue,
      currency: "USD",
      transactionId: key,
      conversionId: key,
      plan: "mapa_pitagorico_11paginas",
    });
  };

  const handleDateChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 8);
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    } else if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    }
    setPixForm((prev) => ({ ...prev, birthDate: formatted }));
  };

  const handleSkipPayment = async () => {
    const cleanDate = pixForm.birthDate.replace(/\D/g, "");
    if (!pixForm.name.trim() || !pixForm.email.trim() || cleanDate.length !== 8) {
      setPixError("Preencha Nome, E-mail e Data (DD/MM/AAAA) antes de pular.");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    const transactionId = pixData?.transaction_id || `DEV_SIMULATED_${Date.now()}`;
    const externalId =
      pixData?.external_id ||
      `MAPA_${Date.now()}__||__${encodeURIComponent(pixForm.name)}__||__${encodeURIComponent(pixForm.email)}__||__${pixForm.birthDate}__||__mapa_completo`;

    if (pollingRef.current) clearInterval(pollingRef.current);

    if (pixStep !== "QR_CODE") {
      trackRedditInitiateCheckout({
        value: 1.0,
        currency: "BRL",
        transactionId,
        plan: "mapa_pitagorico_11paginas",
      });
    }

    setPixStep("PAID");
    triggerRedditPurchase(transactionId, externalId);

    try {
      await fetch("/api/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pixForm.name.trim(),
          email: pixForm.email.trim(),
          birthDate: pixForm.birthDate,
          transaction_id: transactionId,
          external_id: externalId,
          plan: "mapa_pitagorico_11paginas",
          orderBumps,
        }),
      });
      setPixStep("DELIVERED");
    } catch (deliverErr) {
      console.error("[PIX Dev] Erro ao pular pagamento:", deliverErr);
      setPixStep("DELIVERED");
    } finally {
      setPixLoading(false);
    }
  };

  const subscribeRealtimePayment = (transactionId: string, externalId: string) => {
    try {
      const supabase = getSupabaseClient();
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }

      const channelName = `payment_tracker_${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
          },
          async (payload) => {
            const newRow = payload.new as { transaction_id?: string; external_id?: string; status?: string } | null;
            const extPrefix = externalId ? externalId.split("__||__")[0] : "";

            const isMatch =
              newRow &&
              newRow.status === "PAID" &&
              (
                (newRow.external_id && (newRow.external_id === externalId || (extPrefix && newRow.external_id.startsWith(extPrefix)))) ||
                (newRow.transaction_id && String(newRow.transaction_id) === String(transactionId))
              );

            if (isMatch) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              if (realtimeRef.current) {
                supabase.removeChannel(realtimeRef.current);
                realtimeRef.current = null;
              }

              setPixStep("PAID");
              triggerRedditPurchase(transactionId, externalId);
              try {
                await fetch("/api/deliver", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: pixForm.name.trim(),
                    email: pixForm.email.trim(),
                    birthDate: pixForm.birthDate,
                    transaction_id: transactionId,
                    external_id: externalId,
                    plan: "mapa_pitagorico_11paginas",
                    orderBumps,
                  }),
                });
                setPixStep("DELIVERED");
              } catch (deliverErr) {
                console.error("[Realtime Deliver] Erro na entrega:", deliverErr);
                setPixStep("DELIVERED");
              }
            }
          }
        )
        .subscribe();

      realtimeRef.current = channel;
    } catch (err) {
      console.error("[Supabase Realtime] Erro ao conectar:", err);
    }
  };

  const startPixPolling = (transactionId: string, externalId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?id=${transactionId}`);
        const data = await res.json();

        if (data.status === "PAID") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (realtimeRef.current) {
            try {
              const supabase = getSupabaseClient();
              supabase.removeChannel(realtimeRef.current);
              realtimeRef.current = null;
            } catch {
              // ignore
            }
          }

          setPixStep("PAID");
          triggerRedditPurchase(transactionId, externalId);

          try {
            await fetch("/api/deliver", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: pixForm.name.trim(),
                email: pixForm.email.trim(),
                birthDate: pixForm.birthDate,
                transaction_id: transactionId,
                external_id: externalId,
                plan: "mapa_pitagorico_11paginas",
                orderBumps,
              }),
            });
            setPixStep("DELIVERED");
          } catch (deliverErr) {
            console.error("[PIX] Erro na entrega:", deliverErr);
            setPixStep("DELIVERED");
          }
        }
      } catch (pollErr) {
        console.warn("[PIX] Polling status check:", pollErr);
      }
    }, 3000);
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateDigits = pixForm.birthDate.replace(/\D/g, "");
    if (!pixForm.name.trim() || !pixForm.email.trim() || dateDigits.length !== 8) {
      setPixError("Please fill out Full Name, E-mail, and Date of Birth (MM/DD/YYYY).");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    trackRedditInitiateCheckout({
      value: currentTotal,
      currency: "USD",
      transactionId: `CHK_${Date.now()}`,
      plan: "mapa_pitagorico_11paginas",
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pixForm.name.trim(),
          email: pixForm.email.trim(),
          birthDate: pixForm.birthDate,
          plan: "mapa_pitagorico_11paginas",
          orderBumps,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("[Checkout] Error:", err);
      setPixError(err instanceof Error ? err.message : "Unexpected error during checkout.");
    } finally {
      setPixLoading(false);
    }
  };

  const copyPixCode = () => {
    if (!pixData?.pix_copy_paste) return;
    navigator.clipboard.writeText(pixData.pix_copy_paste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  useEffect(() => {
    setIsMounted(true);
    const isLocal =
      process.env.NODE_ENV !== "production" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"));

    if (isLocal) {
      setPixForm((prev) => ({
        name: prev.name || "Felipe Dutra Gonçalves",
        email: prev.email || "felipedutra@outlook.com",
        birthDate: prev.birthDate || "04/10/1991",
      }));
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const l = params.get("lang")?.toLowerCase() || sessionStorage.getItem("destinyvox_landing_lang");
      if (l === "pt" || l === "es" || l === "en") {
        ;
      }

      if (params.get("status") === "success") {
        const sessionId = params.get("session_id") || `STRIPE_${Date.now()}`;
        triggerRedditPurchase(sessionId);
        setPixStep("DELIVERED");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (realtimeRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(realtimeRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-[#040404] text-[#f5f5f5] selection:bg-amber-400 selection:text-black relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1200px] h-[550px] opacity-75 blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(217, 119, 6, 0.12), rgba(180, 83, 9, 0.05), transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.65) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse 85% 70% at 50% 35%, black 20%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 70% at 50% 35%, black 20%, transparent 85%)",
          }}
        />
        <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full border border-amber-500/[0.035] opacity-70" />
        <div className="absolute top-[230px] left-1/2 -translate-x-1/2 w-[560px] sm:w-[720px] h-[560px] sm:h-[720px] rounded-full border border-white/[0.02] opacity-50" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <header className="border-b border-neutral-900 px-4 sm:px-12 py-3.5 sm:py-5 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Image
              src="/favicon.svg"
              alt="DestinyVox Icon"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded-[5px] shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              priority
            />
            <span className="font-mono text-xs sm:text-base tracking-[0.2em] sm:tracking-[0.3em] font-medium sm:font-semibold text-white uppercase">
              DESTINYVOX
            </span>
            <span className="font-mono text-[9px] sm:text-[11px] tracking-widest text-amber-400 uppercase border border-amber-500/30 px-2.5 py-0.5 hidden sm:inline-block bg-amber-500/10">
              {t.subBrand}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs sm:text-sm">
            <a
              href="#pricing"
              className="hidden sm:inline-block bg-white text-black hover:bg-neutral-200 px-5 py-2.5 font-semibold tracking-widest uppercase transition-colors text-xs sm:text-sm"
            >
              {t.navCta}
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-5 sm:px-12 pt-12 sm:pt-20 pb-12 sm:pb-16 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 font-mono text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-amber-300 uppercase">
            <span className="sm:hidden">{t.badge}</span>
            <span className="hidden sm:inline">{t.badgeDesktop}</span>
          </div>

          <div className="space-y-6 sm:space-y-3 md:space-y-3.5">
            <h1 className="font-editorial text-3xl sm:text-6xl md:text-7xl font-normal leading-[1.15] sm:leading-[1.08] tracking-tight text-white sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
              {t.heroTitleLine1}{" "}
              <span className="italic text-amber-400">{t.heroTitleLine2}</span>
            </h1>

            <p className="font-mono font-light text-xs sm:text-base md:text-lg lg:text-xl text-neutral-300 max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto leading-relaxed">
              {t.heroDescription}
            </p>
          </div>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#pricing"
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-9 bg-white text-black hover:bg-neutral-200 font-mono text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 shadow-2xl cursor-pointer"
            >
              <span>{t.ctaMain}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="font-mono text-xs text-neutral-400">
              {t.ctaSub}
            </span>
          </div>
        </section>

        {/* Módulos Calculados */}
        <section className="px-4 sm:px-12 py-8 sm:py-12 max-w-6xl mx-auto">
          <div className="border border-neutral-800 bg-[#080808] p-5 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/30 px-3 sm:px-4 py-1 sm:py-1.5 font-mono text-[11px] sm:text-xs text-amber-300 tracking-wider sm:tracking-widest uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              {t.featureTag}
            </div>

            <div className="space-y-2.5 sm:space-y-4 w-full pt-7 sm:pt-3">
              <span className="font-mono text-xs sm:text-xs md:text-sm tracking-[0.2em] text-neutral-400 uppercase block">
                {t.howItWorksTitle}
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl md:text-3xl text-white font-normal leading-tight">
                {t.howItWorksHeading}
              </h2>
              <p className="font-mono font-light text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed pt-1">
                {t.howItWorksDesc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 font-mono pt-4 sm:pt-6">
                {t.numbersList.map((item: any, idx: number) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="border border-neutral-800 p-5 bg-neutral-950/80 hover:border-amber-500/40 transition-colors space-y-2 relative"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span className="text-white text-xs sm:text-sm font-semibold tracking-wider">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-400/80 font-bold bg-amber-950/40 px-2 py-0.5 border border-amber-500/20">
                          PILAR #{item.num}
                        </span>
                      </div>
                      <p className="text-neutral-300 text-xs sm:text-xs md:text-sm font-light leading-relaxed pt-1">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section com Formulário Embutido (SEM MODAL) */}
        <section id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left Column: Copywriting */}
            <div className="space-y-6 sm:space-y-8 text-left lg:sticky lg:top-24">
              <div className="space-y-3 sm:space-y-4">
                <span className="font-mono text-xs sm:text-sm tracking-[0.25em] text-amber-500 uppercase font-semibold">
                  {t.pricingTag}
                </span>
                <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white font-normal leading-tight">
                  {t.pricingHeading}
                </h2>
                <p className="font-mono font-light text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
                  {t.pricingDesc}
                </p>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <ul className="space-y-4">
                  {t.pricingFeatures.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="font-mono text-sm text-neutral-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Checkout Card */}
            <div className="border border-amber-500/30 rounded-2xl bg-[#0a0a0a] p-6 sm:p-10 space-y-7 text-left shadow-[0_0_80px_rgba(245,158,11,0.1)] relative">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full shadow-md">
              EDIÇÃO COMPLETA • 11 PÁGINAS
            </div>

            {/* Cabeçalho do Card */}
            <div className="space-y-3 border-b border-neutral-800 pb-5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs sm:text-sm tracking-widest text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                  PYTHAGOREAN DESTINY DOSSIER
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-amber-300">
                  HIGH-RES PDF
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-editorial text-5xl sm:text-6xl text-white font-normal">
                  ${displayTotal}
                </span>
                <span className="font-mono text-xs sm:text-sm text-neutral-400">
                  one-time payment
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-300">
                11 dedicated pages of deep content: each vibrational pillar detailed without superficial summaries, with letter-by-letter mathematical decomposition and hermetic activation.
              </p>
            </div>

            {/* FLUXO 1: FORMULÁRIO EMBUTIDO */}
            {pixStep === "FORM" && (
              <form onSubmit={handleGeneratePix} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block font-mono text-xs text-neutral-200 uppercase tracking-wider font-medium">
                      1. Full Birth Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: John Doe"
                      value={pixForm.name}
                      onChange={(e) => setPixForm({ ...pixForm, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                    <span className="font-mono text-[11px] text-neutral-400 block">
                      Used for the rigorous calculation of your Gematria, Expression, Soul, and Personality.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs text-neutral-200 uppercase tracking-wider font-medium">
                        2. Date of Birth
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/DD/YYYY"
                        maxLength={10}
                        value={pixForm.birthDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                      />
                      <span className="font-mono text-[11px] text-neutral-400 block">
                        Life Path and Year 2026.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs text-neutral-200 uppercase tracking-wider font-medium">
                        3. Your Best E-mail
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={pixForm.email}
                        onChange={(e) => setPixForm({ ...pixForm, email: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                      />
                      <span className="font-mono text-[11px] text-neutral-400 block">
                        Where your PDF will be delivered.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2 ORDER BUMPS EMBUTIDOS */}
                <div className="space-y-3 pt-2">
                  <span className="font-mono text-xs text-amber-400 uppercase tracking-widest block font-bold">
                    RECOMMENDED UPGRADES FOR YOUR DOSSIER:
                  </span>

                  {/* Order Bump 1: Dívida Kármica */}
                  <label
                    className={`block border p-4 cursor-pointer transition-all ${
                      orderBumps.karmicDebt
                        ? "border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                        : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={orderBumps.karmicDebt}
                        onChange={(e) =>
                          setOrderBumps({ ...orderBumps, karmicDebt: e.target.checked })
                        }
                        className="mt-1 w-4 h-4 accent-amber-400 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-amber-300 font-bold uppercase">
                            [ADD] Karmic Debts Dossier (13, 14, 16, and 19)
                          </span>
                          <span className="font-mono text-[11px] text-white bg-amber-500/20 border border-amber-500/40 px-2 py-0.2">
                            + $9.90
                          </span>
                        </div>
                        <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                          Identify if you carry ancestral blocks of scarcity, relationship sabotage, or health issues from past lives and access the clearing protocol.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Order Bump 2: Ano Pessoal Mês a Mês */}
                  <label
                    className={`block border p-4 cursor-pointer transition-all ${
                      orderBumps.personalYearMonths
                        ? "border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                        : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={orderBumps.personalYearMonths}
                        onChange={(e) =>
                          setOrderBumps({ ...orderBumps, personalYearMonths: e.target.checked })
                        }
                        className="mt-1 w-4 h-4 accent-amber-400 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-amber-300 font-bold uppercase">
                            [ADICIONAR] Guia Estratégico 2026 Mês a Mês
                          </span>
                          <span className="font-mono text-[11px] text-white bg-amber-500/20 border border-amber-500/40 px-2 py-0.2">
                            + $9.90
                          </span>
                        </div>
                        <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                          Detailed mapping of the 12 months of your 2026 year. Know exactly in which month to sign contracts, invest, save, start new projects, or protect your energy.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {pixError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 font-mono text-xs">
                    {pixError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pixLoading}
                  className="w-full bg-white text-black hover:bg-neutral-200 py-4 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {pixLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>GENERATING SECURE CHECKOUT...</span>
                    </>
                  ) : (
                    <>
                      <span>PROCEED TO CHECKOUT (${displayTotal}) ⟶</span>
                    </>
                  )}
                </button>

                {isDev && (
                  <button
                    type="button"
                    onClick={handleSkipPayment}
                    disabled={pixLoading}
                    className="w-full border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 py-2.5 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Pular Pagamento (Modo Dev - Teste Rápido)</span>
                  </button>
                )}
              </form>
            )}

            {/* FLUXO 2: QR CODE E CÓDIGO COPIA E COLA */}
            {pixStep === "QR_CODE" && pixData && (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-amber-300 font-mono text-xs">
                  CHECKOUT GENERATED • AMOUNT: {displayTotal}
                </div>

                <div className="flex justify-center py-2">
                  <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-2xl inline-block">
                    {pixData.qr_code_base64 ? (
                      <img
                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center font-mono text-xs text-black">
                        QR Code Indisponível
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider block">
                    Código PIX Copia e Cola:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.pix_copy_paste}
                      className="flex-1 bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-neutral-300 truncate focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyPixCode}
                      className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? "COPIADO!" : "COPIAR"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Aguardando confirmação bancária em tempo real...</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPixStep("FORM")}
                    className="flex-1 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white py-2.5 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    ← Voltar e alterar dados
                  </button>

                  {isDev && (
                    <button
                      type="button"
                      onClick={handleSkipPayment}
                      disabled={pixLoading}
                      className="flex-1 border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 py-2.5 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Pular Pagamento (Dev)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* FLUXO 3: PAGAMENTO CONFIRMADO & ENTREGA */}
            {(pixStep === "PAID" || pixStep === "DELIVERED") && (
              <div className="py-8 space-y-4 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
                  Payment Confirmed!
                </h3>
                <p className="font-mono text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
                  {pixStep === "PAID"
                    ? "Generating your Complete Pythagorean Dossier in an 11-page PDF..."
                    : `Your Pythagorean Dossier was successfully generated and sent to ${pixForm.email}!`}
                </p>
                {pixStep === "DELIVERED" && (
                  <div className="pt-2">
                    <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1">
                      Check your inbox and spam folder.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-900 py-12 sm:py-16 px-6 sm:px-12 text-center space-y-4 font-mono font-light text-xs sm:text-sm text-neutral-400">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> {t.footerStripe}
            </span>
            <span>•</span>
            <span>{t.footerGuarantee}</span>
            <span>•</span>
            <span>{t.footerSync}</span>
          </div>
          <div className="text-[11px] sm:text-xs md:text-sm text-neutral-500 font-light">
            {t.footerCopyright}
          </div>
        </footer>
      </div>
    </div>
  );
}
