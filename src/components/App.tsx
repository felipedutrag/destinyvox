"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  X,
  Copy,
  Check,
  Loader2,
  QrCode,
  Sparkles,
  Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Language = "en" | "pt" | "es";

const TRANSLATIONS = {
  en: {
    badge: "DESTINYVOX ORACLE AI",
    badgeDesktop: "DESTINYVOX ORACLE • HERMETIC ARTIFICIAL INTELLIGENCE",
    syncNote: "• The Oracle on Reddit will be unlocked immediately after activation",
    subBrand: "AI ORACLE",
    navCta: "CONSULT ORACLE ⟶",
    heroTitleLine1: "Ask anything",
    heroTitleLine2: "to your own cosmos.",
    heroDescription:
      "You have already computed your soul's numbers. Now, converse directly with the DestinyVox Oracle: hyper-personalized answers on life decisions, love, career, hidden obstacles, and the exact timing for every move.",
    ctaMain: "UNLOCK THE AI ORACLE",
    ctaSub: "Instant activation in the Reddit app",
    featureTag: "REAL-TIME DEEP ANSWERS",
    howItWorksTitle: "HOW THE ORACLE WORKS WITH YOUR CHART",
    howItWorksHeading: "An intelligence powered by your Pythagorean coordinates",
    howItWorksDesc: (user: string) =>
      `Unlike generic AIs, the DestinyVox Oracle cross-references your Life Path, Soul Urge, and Personal Year on every question. It recognizes subconscious patterns and delivers razor-sharp guidance in the Reddit app for ${user || "you"}:`,
    features: [
      {
        title: "✦ DECISIONS & COSMIC TIMING",
        desc: "Know exactly whether the current period favors bold career shifts, new partnerships, or strategic patience.",
      },
      {
        title: "✦ TARGETED SACRED INQUIRIES",
        desc: "Ask deep, meaningful questions about love, career, and dilemmas. Each credit unlocks an in-depth Hermetic reading that never expires.",
      },
      {
        title: "✦ DAILY COSMIC ANALYSES",
        desc: "Daily personalized insights synchronized with your personal day and current planetary transit cycles.",
      },
      {
        title: "✦ PRIORITY ARCHETYPAL REASONING",
        desc: "Processing with maximum depth and multi-layered esoteric reasoning on every single inquiry.",
      },
    ],
    pricingTag: "CONSULTATION PLANS",
    pricingHeading: "Activate your journey's Oracle",
    pricingDesc: "Immediate access to speak with your chart's artificial intelligence inside Reddit.",
    plan1: {
      name: "10 ORACLE QUESTIONS",
      badge: "10 CREDITS",
      price: "$9",
      period: "one-time",
      userNote: (user: string) => `Access for u/${user || "you"}`,
      perks: [
        "10 full questions with the AI Oracle",
        "Direct Pythagorean & astrological cross-referencing",
        "Deep Hermetic reasoning & tailored insights",
        "Sharp guidance on love, career, and cosmic timing",
        "Immediate unlock in the Reddit app",
        "Credits never expire — consult anytime",
      ],
      button: "GET 10 QUESTIONS ⟶",
      buttonLoading: "CONNECTING TO STRIPE...",
    },
    plan2: {
      popularTag: "BEST VALUE • 30 CREDITS",
      name: "30 ORACLE QUESTIONS",
      badge: "SAVE 30%",
      price: "$19",
      period: "one-time",
      subText: "Most popular for deep guidance",
      perks: [
        "30 full questions with the AI Oracle",
        "Direct Pythagorean & astrological cross-referencing",
        "Deep Hermetic reasoning & tailored insights",
        "Sharp guidance on love, career, and cosmic timing",
        "Immediate unlock in the Reddit app",
        "Credits never expire — consult anytime",
      ],
      button: "GET 30 QUESTIONS ⟶",
      buttonLoading: "CONNECTING TO STRIPE...",
    },
    footerStripe: "Stripe Encrypted Payment",
    footerGuarantee: "7-Day Unconditional Guarantee",
    footerSync: "Instant Sync with Reddit",
    footerCopyright: `DESTINYVOX ORACLE © ${new Date().getFullYear()} — HERMETIC COSMIC INTELLIGENCE.`,
    modalTitle: "CONFIRM YOUR REDDIT USERNAME",
    modalDesc: "To ensure your cosmic map and Oracle access are unlocked immediately in Reddit, enter your Reddit username below:",
    modalPlaceholder: "e.g. YourRedditUsername",
    modalButton: "CONTINUE TO SECURE CHECKOUT ⟶",
    modalCancel: "Cancel",
  },
  pt: {
    badge: "DESTINYVOX ORACLE AI",
    badgeDesktop: "ORÁCULO DESTINYVOX • INTELIGÊNCIA ARTIFICIAL HERMÉTICA",
    syncNote: "• O Oráculo no Reddit será desbloqueado imediatamente após a ativação",
    subBrand: "ORÁCULO IA",
    navCta: "CONSULTAR ORÁCULO ⟶",
    heroTitleLine1: "Pergunte qualquer coisa",
    heroTitleLine2: "ao seu próprio cosmos.",
    heroDescription:
      "Você já calculou os números da sua alma. Agora, dialogue diretamente com o Oráculo DestinyVox: respostas ultra-personalizadas sobre decisões de vida, amor, carreira, desafios ocultos e o tempo exato de cada movimento.",
    ctaMain: "DESBLOQUEAR O ORÁCULO IA",
    ctaSub: "Ativação imediata no app do Reddit",
    featureTag: "RESPOSTAS PROFUNDAS EM TEMPO REAL",
    howItWorksTitle: "COMO O ORÁCULO FUNCIONA COM SEU MAPA",
    howItWorksHeading: "Uma mente alimentada pelas suas coordenadas pitagóricas",
    howItWorksDesc: (user: string) =>
      `Diferente de IAs genéricas, o Oráculo DestinyVox cruza seu Caminho de Vida, Desejo da Alma e Ano Pessoal a cada pergunta. Ele entende seus bloqueios inconscientes e entrega direcionamentos cirúrgicos no app do Reddit para ${user ? `u/${user}` : "você"}:`,
    features: [
      {
        title: "✦ DECISÕES & TIMING CÓSMICO",
        desc: "Saiba exatamente se o momento atual favorece mudanças de carreira, novos negócios ou paciência estratégica.",
      },
      {
        title: "✦ CONSULTAS CIRÚRGICAS & DIRECIONADAS",
        desc: "Faça perguntas profundas sobre amor, vocação e dilemas reais. Cada crédito ativa uma resposta hermética densa e personalizada que nunca expira.",
      },
      {
        title: "✦ ANÁLISES DIÁRIAS",
        desc: "Insights diários personalizados sincronizados com o seu dia pessoal e trânsitos arquetípicos.",
      },
      {
        title: "✦ RESPOSTAS PRIORITÁRIAS",
        desc: "Processamento com máxima profundidade e raciocínio hermético avançado em cada consulta.",
      },
    ],
    pricingTag: "PLANOS DE CONSULTA",
    pricingHeading: "Ative o Oráculo da sua jornada",
    pricingDesc: "Acesso imediato para conversar com a inteligência artificial do seu mapa dentro do Reddit.",
    plan1: {
      name: "10 PERGUNTAS NO ORÁCULO",
      badge: "10 CRÉDITOS",
      price: "R$ 19,90",
      period: "pagamento único via PIX",
      userNote: (user: string) => `Acesso para ${user ? `u/${user}` : "você"}`,
      perks: [
        "10 consultas completas com o Oráculo IA",
        "Cruzamento direto com seu mapa numerológico",
        "Raciocínio hermético e análises aprofundadas",
        "Respostas cirúrgicas sobre amor, carreira e timing",
        "Desbloqueio imediato no app do Reddit",
        "Créditos não expiram — use quando desejar",
      ],
      button: "GERAR PIX (R$ 19,90) ⟶",
      buttonLoading: "GERANDO PIX...",
    },
    plan2: {
      popularTag: "MAIS ESCOLHIDO • 30 CRÉDITOS",
      name: "30 PERGUNTAS NO ORÁCULO",
      badge: "ECONOMIZE 30%",
      price: "R$ 39,90",
      period: "pagamento único via PIX",
      subText: "Melhor custo-benefício para respostas profundas",
      perks: [
        "30 consultas completas com o Oráculo IA",
        "Cruzamento direto com seu mapa numerológico",
        "Raciocínio hermético e análises aprofundadas",
        "Respostas cirúrgicas sobre amor, carreira e timing",
        "Desbloqueio imediato no app do Reddit",
        "Créditos não expiram — use quando desejar",
      ],
      button: "GERAR PIX (R$ 39,90) ⟶",
      buttonLoading: "GERANDO PIX...",
    },
    footerStripe: "Pagamento Instantâneo via PIX (GGPIX)",
    footerGuarantee: "Garantia Incondicional de 7 Dias",
    footerSync: "Sincronização Instantânea com o Reddit & Supabase",
    footerCopyright: `DESTINYVOX ORACLE © ${new Date().getFullYear()} — INTELIGÊNCIA CÓSMICA HERMÉTICA.`,
    modalTitle: "CONFIRME SEU USUÁRIO DO REDDIT",
    modalDesc: "Para vincular e desbloquear seu Oráculo imediatamente no aplicativo do Reddit, informe seu usuário:",
    modalPlaceholder: "ex: SeuUsuarioReddit",
    modalButton: "PROSSEGUIR PARA PAGAMENTO SEGURO ⟶",
    modalCancel: "Cancelar",
  },
  es: {
    badge: "DESTINYVOX ORACLE AI",
    badgeDesktop: "ORÁCULO DESTINYVOX • INTELIGENCIA ARTIFICIAL HERMÉTICA",
    syncNote: "• El Oráculo en Reddit se desbloqueará de inmediato tras la activación",
    subBrand: "ORÁCULO IA",
    navCta: "CONSULTAR ORÁCULO ⟶",
    heroTitleLine1: "Pregunta cualquier cosa",
    heroTitleLine2: "a tu propio cosmos.",
    heroDescription:
      "Ya calculaste los números de tu alma. Ahora dialoga directamente con el Oráculo DestinyVox: respuestas hiperpersonalizadas sobre decisiones de vida, amor, carrera, desafíos ocultos y el momento exacto para cada movimiento.",
    ctaMain: "DESBLOQUEAR EL ORÁCULO IA",
    ctaSub: "Activación inmediata en la app de Reddit",
    featureTag: "RESPUESTAS PROFUNDAS EN TIEMPO REAL",
    howItWorksTitle: "CÓMO FUNCIONA EL ORÁCULO CON TU CARTA",
    howItWorksHeading: "Una mente alimentada por tus coordenadas pitagóricas",
    howItWorksDesc: (user: string) =>
      `A diferencia de las IAs genéricas, el Oráculo DestinyVox cruza tu Camino de Vida, Deseo del Alma y Año Personal en cada pregunta. Comprende tus bloqueos subconscientes y entrega orientación quirúrgica en Reddit para ${user ? `u/${user}` : "ti"}:`,
    features: [
      {
        title: "✦ DECISIONES & TIMING CÓSMICO",
        desc: "Descubre exactamente si el ciclo actual favorece cambios de carrera, nuevos proyectos o paciencia estratégica.",
      },
      {
        title: "✦ CONSULTAS QUIRÚRGICAS & DIRIGIDAS",
        desc: "Haz preguntas profundas sobre amor, vocación y dilemas personales. Cada crédito activa una respuesta hermética densa y personalizada que nunca caduca.",
      },
      {
        title: "✦ ANÁLISIS DIARIOS",
        desc: "Perspectivas diarias personalizadas sincronizadas con tu día personal y ciclos planetarios.",
      },
      {
        title: "✦ RAZONAMIENTO ARQUETÍPICO PRIORITARIO",
        desc: "Procesamiento con máxima profundidad y sabiduría hermética en cada respuesta.",
      },
    ],
    pricingTag: "PLANES DE CONSULTA",
    pricingHeading: "Activa el Oráculo de tu camino",
    pricingDesc: "Acceso inmediato para conversar con la inteligencia artificial de tu carta dentro de Reddit.",
    plan1: {
      name: "10 PREGUNTAS AL ORÁCULO",
      badge: "10 CRÉDITOS",
      price: "$9",
      period: "pago único",
      userNote: (user: string) => `Acceso para u/${user || "ti"}`,
      perks: [
        "10 consultas completas con el Oráculo IA",
        "Cruce directo con tus coordenadas pitagóricas",
        "Razonamiento hermético y análisis profundos",
        "Orientación precisa en amor, carrera y timing cósmico",
        "Desbloqueo inmediato en la app de Reddit",
        "Créditos sin vencimiento — úsalos cuando desees",
      ],
      button: "OBTENER 10 PREGUNTAS ⟶",
      buttonLoading: "CONECTANDO CON STRIPE...",
    },
    plan2: {
      popularTag: "MÁS ELEGIDO • 30 CRÉDITOS",
      name: "30 PREGUNTAS AL ORÁCULO",
      badge: "AHORRA 30%",
      price: "$19",
      period: "pago único",
      subText: "El paquete preferido para orientación profunda",
      perks: [
        "30 consultas completas con el Oráculo IA",
        "Cruce directo con tus coordenadas pitagóricas",
        "Razonamiento hermético y análisis profundos",
        "Orientación precisa en amor, carrera y timing cósmico",
        "Desbloqueo inmediato en la app de Reddit",
        "Créditos sin vencimiento — úsalos cuando desees",
      ],
      button: "OBTENER 30 PREGUNTAS ⟶",
      buttonLoading: "CONECTANDO CON STRIPE...",
    },
    footerStripe: "Pago Encriptado Stripe",
    footerGuarantee: "Garantía Incondicional de 7 Días",
    footerSync: "Sincronización Instantánea con Reddit",
    footerCopyright: `DESTINYVOX ORACLE © ${new Date().getFullYear()} — INTELIGENCIA CÓSMICA HERMÉTICA.`,
    modalTitle: "CONFIRMA TU USUARIO DE REDDIT",
    modalDesc: "Para asegurar que tu carta y el Oráculo se desbloqueen al instante en Reddit, escribe tu usuario:",
    modalPlaceholder: "ej: TuUsuarioReddit",
    modalButton: "CONTINUAR AL PAGO SEGURO ⟶",
    modalCancel: "Cancelar",
  },
};

export function App() {
  const [lang, setLang] = useState<Language>("pt");
  const [redditUser, setRedditUser] = useState<string>("");
  const [userToken, setUserToken] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  type PlanKey = "10_questions" | "30_questions";

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [modalInput, setModalInput] = useState<string>("");

  // PIX Checkout State (GGPIX)
  const isDev = process.env.NODE_ENV !== "production";
  const [isPixModalOpen, setIsPixModalOpen] = useState<boolean>(false);
  const [pixStep, setPixStep] = useState<"FORM" | "QR_CODE" | "PAID" | "DELIVERED">("FORM");
  const [pixPlan, setPixPlan] = useState<PlanKey>("30_questions");
  const [pixForm, setPixForm] = useState({
    name: isDev ? "Felipe Dutra Gonçalves" : "",
    email: isDev ? "felipedutra@outlook.com" : "",
    birthDate: isDev ? "04/10/1991" : "",
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
      setPixError("Por favor, preencha Nome, E-mail e Data (DD/MM/AAAA) antes de pular.");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    const transactionId = pixData?.transaction_id || `DEV_SIMULATED_${Date.now()}`;
    const externalId =
      pixData?.external_id ||
      `MAPA_${Date.now()}__||__${encodeURIComponent(pixForm.name)}__||__${encodeURIComponent(pixForm.email)}__||__${pixForm.birthDate}__||__${pixPlan}`;

    if (pollingRef.current) clearInterval(pollingRef.current);
    setPixStep("PAID");

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
          plan: pixPlan,
        }),
      });
      setPixStep("DELIVERED");
    } catch (deliverErr) {
      console.error("[PIX Dev] Erro ao pular pagamento e entregar:", deliverErr);
      setPixStep("DELIVERED");
    } finally {
      setPixLoading(false);
    }
  };

  const realtimeRef = useRef<RealtimeChannel | null>(null);

  const subscribeRealtimePayment = (transactionId: string, externalId: string) => {
    try {
      const supabase = getSupabaseClient();
      if (realtimeRef.current) {
        console.log("🧹 [Supabase Realtime] Removendo canal anterior...");
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }

      console.log(`⚡ [Supabase Realtime] Iniciando conexão... Transaction ID: "${transactionId}", External ID: "${externalId}"`);

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
            console.log("🔔 [Supabase Realtime] Evento recebido no banco:", payload.eventType, payload);
            const newRow = payload.new as { transaction_id?: string; external_id?: string; status?: string } | null;
            const extPrefix = externalId ? externalId.split("__||__")[0] : "";

            console.log("🔍 [Supabase Realtime] Checando linha atualizada:", {
              status: newRow?.status,
              row_external_id: newRow?.external_id,
              target_external_id: externalId,
              row_transaction_id: newRow?.transaction_id,
              target_transaction_id: transactionId,
            });

            const isMatch =
              newRow &&
              newRow.status === "PAID" &&
              (
                (newRow.external_id && (newRow.external_id === externalId || (extPrefix && newRow.external_id.startsWith(extPrefix)))) ||
                (newRow.transaction_id && String(newRow.transaction_id) === String(transactionId))
              );

            if (isMatch) {
              console.log("🎉 [Supabase Realtime] MATCH CONFIRMADO! Pagamento aprovado pelo Webhook!");
              if (pollingRef.current) clearInterval(pollingRef.current);
              if (realtimeRef.current) {
                supabase.removeChannel(realtimeRef.current);
                realtimeRef.current = null;
              }

              setPixStep("PAID");
              try {
                console.log("🚀 [Supabase Realtime] Disparando /api/deliver...");
                await fetch("/api/deliver", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: pixForm.name.trim(),
                    email: pixForm.email.trim(),
                    birthDate: pixForm.birthDate,
                    transaction_id: transactionId,
                    external_id: externalId,
                    plan: pixPlan,
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
        .subscribe((status, err) => {
          console.log(`📡 [Supabase Realtime] Status da conexão: "${status}"`, err ? `Erro: ${JSON.stringify(err)}` : "");
          if (status === "SUBSCRIBED") {
            console.log("🟢 [Supabase Realtime] Canal CONECTADO com sucesso! Escutando tabela public.payments.");
          } else if (status === "CHANNEL_ERROR") {
            console.error("🔴 [Supabase Realtime] Erro ao conectar canal. Verifique permissões/publicação no Supabase.", err);
          } else if (status === "TIMED_OUT") {
            console.warn("🟡 [Supabase Realtime] Timeout na conexão WebSocket.");
          }
        });

      realtimeRef.current = channel;
    } catch (err) {
      console.error("[Supabase Realtime] Falha crítica ao registrar escuta:", err);
    }
  };

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
        setLang(l as Language);
      }
      const u = params.get("u") || params.get("user") || params.get("reddit_user") || sessionStorage.getItem("destinyvox_landing_user") || "";
      if (u) {
        setRedditUser(u.replace(/^u\//i, "").trim());
      }
      const tok = params.get("ref") || params.get("token") || sessionStorage.getItem("destinyvox_landing_ref") || "";
      if (tok) {
        setUserToken(tok.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (redditUser) {
      sessionStorage.setItem("destinyvox_landing_user", redditUser);
    }
    if (userToken) {
      sessionStorage.setItem("destinyvox_landing_ref", userToken);
    }
    if (lang) {
      sessionStorage.setItem("destinyvox_landing_lang", lang);
    }
  }, [redditUser, userToken, lang, isMounted]);

  const t = TRANSLATIONS[lang];

  const proceedToStripe = async (plan: PlanKey, username: string) => {
    setIsRedirecting(true);
    setLoadingPlan(plan);
    setErrorMessage(null);

    const clean = username.replace(/^u[\/_]/i, "").trim();

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          redditUsername: clean,
          locale: lang,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to initialize checkout session");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("[checkout] Error redirecting to Stripe:", err);
      setIsRedirecting(false);
      setLoadingPlan(null);
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred while connecting to Stripe"
      );
    }
  };

  const handleCheckout = (plan: PlanKey) => {
    if (lang === "pt") {
      setPixPlan(plan);
      setPixStep("FORM");
      setPixError(null);
      setIsPixModalOpen(true);
      return;
    }

    const activeUsername = redditUser || userToken;
    if (activeUsername) {
      proceedToStripe(plan, activeUsername);
      return;
    }

    setPendingPlan(plan);
    setModalInput("");
    setIsModalOpen(true);
  };

  const startPixPolling = (transactionId: string, externalId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    console.log(`🚀 [PIX Polling] Polling de fallback ativo para transação ${transactionId}`);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?id=${transactionId}`);
        const data = await res.json();

        if (data.status === "PAID") {
          console.log("✅ [PIX Polling] Pagamento identificado via polling de fallback!");
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

          // Disparar entrega do mapa e gravação no Supabase (protegido contra duplicações)
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
                plan: pixPlan,
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
      setPixError("Por favor, preencha todos os campos (Data de nascimento no formato DD/MM/AAAA).");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pixForm.name.trim(),
          email: pixForm.email.trim(),
          birthDate: pixForm.birthDate,
          plan: pixPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao gerar cobrança PIX");
      }

      // Se o pagamento for aprovado automaticamente (ex: felipedutra@outlook.com)
      if (data.status === "PAID" || data.auto_paid) {
        setPixStep("PAID");
        try {
          await fetch("/api/deliver", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pixForm.name.trim(),
              email: pixForm.email.trim(),
              birthDate: pixForm.birthDate,
              transaction_id: String(data.transaction_id),
              external_id: data.external_id,
              plan: pixPlan,
            }),
          });
          setPixStep("DELIVERED");
        } catch (deliverErr) {
          console.error("[PIX] Erro na entrega:", deliverErr);
          setPixStep("DELIVERED");
        }
        return;
      }

      setPixData({
        transaction_id: String(data.transaction_id),
        qr_code_base64: data.qr_code_base64 || "",
        pix_copy_paste: data.pix_copy_paste || data.qr_code || "",
        external_id: data.external_id || "",
      });
      setPixStep("QR_CODE");
      subscribeRealtimePayment(String(data.transaction_id), data.external_id || "");
      startPixPolling(String(data.transaction_id), data.external_id || "");
    } catch (err) {
      console.error("[PIX] Erro ao gerar checkout:", err);
      setPixError(err instanceof Error ? err.message : "Erro ao gerar PIX");
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

  const handleConfirmModalUser = () => {
    const clean = modalInput.replace(/^u[\/_]/i, "").trim();
    if (!clean) return;

    setRedditUser(clean);
    setIsModalOpen(false);

    if (pendingPlan) {
      proceedToStripe(pendingPlan, clean);
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-[#f5f5f5] selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Subtle Atmospheric Cosmic Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top Hero Ambient Radial Glow */}
        <div
          className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1200px] h-[550px] opacity-75 blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(217, 119, 6, 0.12), rgba(180, 83, 9, 0.05), transparent 75%)",
          }}
        />

        {/* Delicate Constellation Grid */}
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

        {/* Faint Sacred Geometry Planetary Orbit Rings */}
        <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full border border-amber-500/[0.035] opacity-70" />
        <div className="absolute top-[230px] left-1/2 -translate-x-1/2 w-[560px] sm:w-[720px] h-[560px] sm:h-[720px] rounded-full border border-white/[0.02] opacity-50" />

        {/* Bottom Ambient Pricing Aura */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[450px] opacity-40 blur-[100px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(245, 158, 11, 0.08), transparent 75%)",
          }}
        />
      </div>

      {/* Modal PIX Checkout (GGPIX - Brasil) */}
      {isPixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-amber-500/30 p-6 sm:p-8 w-full max-w-lg space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative">
            <button
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setIsPixModalOpen(false);
              }}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header com Badge */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] text-amber-300 uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-amber-400" />
                DESTINYVOX • PAGAMENTO VIA PIX
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
                30 Consultas & Mapa Pitagórico Completo
              </h3>
              <p className="font-mono text-xs text-neutral-400">
                Valor: <span className="text-white font-bold">{isDev ? "R$ 1,00 (DEV)" : "R$ 39,90"}</span> • Liberação Imediata
              </p>
            </div>

            {/* ETAPA 1: FORMULÁRIO DE DADOS */}
            {pixStep === "FORM" && (
              <form onSubmit={handleGeneratePix} className="space-y-4">
                <div className="space-y-1">
                  <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider">
                    Nome Completo (Certidão)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: João da Silva"
                    value={pixForm.name}
                    onChange={(e) => setPixForm({ ...pixForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="font-mono text-[10px] text-neutral-500">Usado para o cálculo exato da sua Gematria e Expressão.</span>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider">
                    Seu Melhor E-mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: seuemail@gmail.com"
                    value={pixForm.email}
                    onChange={(e) => setPixForm({ ...pixForm, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="font-mono text-[10px] text-neutral-500">Onde você receberá o dossiê PDF e o acesso ao Oráculo.</span>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider">
                    Data de Nascimento (DD/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 04/10/1991"
                    maxLength={10}
                    value={pixForm.birthDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="font-mono text-[10px] text-neutral-500">Formato brasileiro (DD/MM/AAAA). Fundamental para o Caminho de Vida e Ano Pessoal.</span>
                </div>

                {pixError && (
                  <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 font-mono text-xs">
                    {pixError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pixLoading}
                  className="w-full bg-white text-black hover:bg-neutral-200 py-3.5 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {pixLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      GERANDO PIX...
                    </>
                  ) : (
                    <>
                      GERAR PAGAMENTO PIX ⟶
                    </>
                  )}
                </button>

                {isDev && (
                  <button
                    type="button"
                    onClick={handleSkipPayment}
                    disabled={pixLoading}
                    className="w-full border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 py-3 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Pular Pagamento (Modo Dev)</span>
                  </button>
                )}
              </form>
            )}

            {/* ETAPA 2: QR CODE E CÓDIGO COPIA E COLA */}
            {pixStep === "QR_CODE" && pixData && (
              <div className="space-y-5 text-center">
                {/* QR Code Container */}
                <div className="flex justify-center py-2">
                  <div className="p-3 bg-white border border-neutral-200 rounded-lg shadow-xl inline-block">
                    {pixData.qr_code_base64 ? (
                      <img
                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center font-mono text-xs text-black">
                        QR Code Indisponível
                      </div>
                    )}
                  </div>
                </div>

                {/* Copia e Cola */}
                <div className="space-y-2 text-left">
                  <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider block">
                    Código PIX Copia e Cola:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.pix_copy_paste}
                      className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs font-mono text-neutral-300 truncate focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyPixCode}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400 font-bold">COPIADO!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          COPIAR
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status em tempo real */}
                <div className="border border-neutral-800 bg-neutral-950/70 p-3.5 flex items-center justify-center gap-3 font-mono text-xs text-neutral-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Aguardando confirmação do banco...</span>
                </div>
                <p className="font-mono text-[11px] text-neutral-500">
                  Assim que o pagamento for feito no seu app, seu mapa será ativado automaticamente aqui.
                </p>

                {isDev && (
                  <button
                    type="button"
                    onClick={handleSkipPayment}
                    disabled={pixLoading}
                    className="w-full border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 py-3 font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Pular / Simular Pagamento Aprovado (Modo Dev)</span>
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 3: PAGAMENTO CONFIRMADO / PROCESSANDO */}
            {pixStep === "PAID" && (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/40 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="font-editorial text-2xl text-white">Pagamento Confirmado!</h4>
                <div className="flex items-center justify-center gap-2 font-mono text-xs text-amber-300">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Calculando suas coordenadas e gerando dossiê cósmico...</span>
                </div>
              </div>
            )}

            {/* ETAPA 4: ENTREGUE COM SUCESSO */}
            {pixStep === "DELIVERED" && (
              <div className="py-6 text-center space-y-5">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-editorial text-2xl text-white">Seu Mapa foi Revelado!</h4>
                  <p className="font-mono text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                    O dossiê completo foi gerado, salvo com segurança no banco de dados Supabase e enviado para o e-mail:
                  </p>
                  <p className="font-mono text-sm text-amber-300 font-bold">{pixForm.email}</p>
                </div>
                <button
                  onClick={() => setIsPixModalOpen(false)}
                  className="w-full bg-white text-black py-3 font-mono text-xs font-bold tracking-widest uppercase hover:bg-neutral-200 cursor-pointer"
                >
                  CONCLUIR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Modal Username */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0a] border border-neutral-800 p-6 sm:p-8 w-full max-w-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm sm:text-base tracking-widest text-white uppercase">{t.modalTitle}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <p className="font-mono font-light text-neutral-400 text-xs sm:text-sm leading-relaxed">{t.modalDesc}</p>
            <input
              type="text"
              autoFocus
              placeholder={t.modalPlaceholder}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white font-mono text-sm sm:text-base focus:outline-none focus:border-white"
            />
            <button
              onClick={handleConfirmModalUser}
              className="w-full bg-white text-black py-3 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-neutral-200 cursor-pointer"
            >
              {t.modalButton}
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Reddit Recognition */}
      {redditUser && (
        <div className="bg-[#111111] border-b border-neutral-800 py-2.5 px-4 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 font-mono text-xs sm:text-xs tracking-wider text-neutral-300">
            <span className="text-amber-400">✦</span>
            <span className="text-white font-bold bg-neutral-900 border border-neutral-700 px-2 py-0.5">
              u/{redditUser}
            </span>
            <span className="hidden sm:inline text-neutral-400">{t.syncNote}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
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
          <span className="font-mono text-[9px] sm:text-[11px] tracking-widest text-neutral-400 uppercase border border-neutral-800 px-2.5 py-0.5 hidden sm:inline-block">
            {t.subBrand}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs sm:text-sm">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 sm:gap-1.5 border border-neutral-800 px-2 sm:px-2.5 py-1 bg-neutral-950">
            {(["pt", "en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-1.5 py-0.5 text-[11px] sm:text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                  lang === l
                    ? "text-white font-bold border-b border-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <a
            href="#pricing"
            className="hidden sm:inline-block bg-white text-black hover:bg-neutral-200 px-5 py-2.5 font-semibold tracking-widest uppercase transition-colors text-xs sm:text-sm"
          >
            {t.navCta}
          </a>
        </div>
      </header>

      {/* Hero Section Editorial */}
      <section className="px-5 sm:px-12 pt-12 sm:pt-20 pb-12 sm:pb-16 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center border border-neutral-800 bg-neutral-950/80 px-3.5 py-1.5 font-mono text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-neutral-300 uppercase">
          <span className="sm:hidden">{t.badge}</span>
          <span className="hidden sm:inline">{t.badgeDesktop}</span>
        </div>

        <div className="space-y-6 sm:space-y-3 md:space-y-3.5">
          <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.12] sm:leading-[1.08] tracking-tight text-white sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
            {t.heroTitleLine1}{" "}
            <span className="italic text-neutral-400">{t.heroTitleLine2}</span>
          </h1>

          <p className="font-mono font-light text-xs sm:text-base md:text-lg lg:text-xl text-neutral-300 max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto leading-relaxed">
            {t.heroDescription}
          </p>
        </div>

        {/* Dynamic CTA */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-9 bg-white text-black hover:bg-neutral-200 font-mono text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 shadow-2xl cursor-pointer"
          >
            <span>{t.ctaMain}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <span className="font-mono text-xs sm:text-xs text-neutral-400">
            {t.ctaSub}
          </span>
        </div>
      </section>

      {/* Feature Section */}
      <section className="px-4 sm:px-12 py-8 sm:py-12 max-w-5xl mx-auto">
        <div className="border border-neutral-800 bg-[#080808] p-5 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/30 px-3 sm:px-4 py-1 sm:py-1.5 font-mono text-[11px] sm:text-xs text-amber-300 tracking-wider sm:tracking-widest uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            {t.featureTag}
          </div>

          <div className="space-y-2.5 sm:space-y-4 w-full pt-7 sm:pt-3">
            <span className="font-mono text-xs sm:text-xs md:text-sm tracking-[0.2em] text-neutral-400 uppercase block">
              {t.howItWorksTitle}
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl text-white font-normal leading-tight">
              {t.howItWorksHeading}
            </h2>
            <p className="font-mono font-light text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed pt-1">
              {t.howItWorksDesc(redditUser)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 font-mono pt-3 sm:pt-4">
              {t.features.map((f, i) => (
                <div key={i} className="border border-neutral-800 p-4 sm:p-5 bg-neutral-950 space-y-1.5 sm:space-y-2">
                  <span className="text-white text-xs sm:text-sm md:text-[15px] font-semibold block">{f.title}</span>
                  <p className="text-neutral-300 text-xs sm:text-xs md:text-sm font-light leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-5xl mx-auto space-y-8 sm:space-y-12 text-center">
        <div className="space-y-2 sm:space-y-3">
          <span className="font-mono text-xs sm:text-xs md:text-sm tracking-[0.25em] text-neutral-400 uppercase">
            {t.pricingTag}
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl text-white font-normal">
            {t.pricingHeading}
          </h2>
          <p className="font-mono font-light text-xs sm:text-sm md:text-base text-neutral-300 max-w-lg mx-auto leading-relaxed">
            {t.pricingDesc}
          </p>
        </div>

        {/* Pricing Card (Plano Único) */}
        <div className="max-w-xl mx-auto text-left">
          {/* Plano 2: 30 Perguntas */}
          <div className="border border-white/70 sm:border-2 sm:border-white bg-[#0a0a0a] p-6 sm:p-10 space-y-6 flex flex-col justify-between relative shadow-[0_0_50px_rgba(245,158,11,0.12)]">
            <div className="absolute -top-3 right-4 sm:right-6 bg-white text-black font-mono text-[9px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase px-2.5 sm:px-3.5 py-0.5">
              {t.plan2.popularTag}
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs sm:text-sm tracking-widest text-amber-300 uppercase font-semibold">
                  {t.plan2.name}
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest border border-white/60 sm:border-white px-2.5 py-0.5 text-white">
                  {t.plan2.badge}
                </span>
              </div>
              <div>
                <div className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white font-normal flex items-baseline gap-2">
                  <span>{isDev && lang === "pt" ? "R$ 1,00" : t.plan2.price}</span>
                  <span className="text-sm sm:text-base md:text-lg font-mono text-neutral-300 capitalize font-light">{t.plan2.period}</span>
                </div>
                <span className="font-mono text-xs sm:text-xs md:text-sm text-neutral-300 tracking-wider">
                  {t.plan2.subText}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-4 sm:pt-5 space-y-2.5 sm:space-y-3.5 font-mono text-xs sm:text-sm md:text-[15px] text-neutral-100">
                {t.plan2.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className={i === 0 ? "font-semibold text-white" : ""}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCheckout("30_questions")}
              disabled={isRedirecting}
              className="w-full h-12 sm:h-14 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <span>
                {loadingPlan === "30_questions"
                  ? t.plan2.buttonLoading
                  : t.plan2.button}
              </span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto p-3 bg-red-950/50 border border-red-800 text-red-300 font-mono text-xs sm:text-sm text-center">
            {errorMessage}
          </div>
        )}
      </section>

      {/* Security & Guarantee */}
      <footer className="border-t border-neutral-900 py-12 sm:py-16 px-6 sm:px-12 text-center space-y-4 font-mono font-light text-xs sm:text-sm text-neutral-400">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.footerStripe}
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
