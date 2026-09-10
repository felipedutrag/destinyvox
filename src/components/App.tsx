"use client";

import { useState, useEffect } from "react";
import { Sparkles, Shield, ArrowRight, CheckCircle2, Lock, X } from "lucide-react";

type Language = "en" | "pt" | "es";

const TRANSLATIONS = {
  en: {
    badge: "DESTINYVOX ORACLE",
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
        title: "✦ UNLIMITED DIALOGUE",
        desc: "Ask deep questions, clear doubts about relationships, and dissect dilemmas without conversational limits.",
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
      name: "ESSENTIAL ORACLE",
      badge: "ONE PAYMENT",
      price: "$9",
      period: "/month for 1 month",
      userNote: (user: string) => `Access for u/${user || "you"}`,
      perks: [
        "1 Map included",
        "Daily personalized analyses",
        "50 personalized consultations with the Oracle",
        "Deep inquiries on love, finances, and vocation",
        "12-Month Personal Year strategic forecast",
        "Complete 360° Archetypal Dossier included",
      ],
      button: "ACTIVATE ESSENTIAL ORACLE ⟶",
      buttonLoading: "CONNECTING TO STRIPE...",
    },
    plan2: {
      popularTag: "MOST POPULAR • UNLIMITED CHARTS",
      name: "VIP UNLIMITED ORACLE",
      badge: "LIFESTYLE",
      price: "$19",
      period: "lifestyle",
      subText: "Unlimited questions forever",
      perks: [
        "Unlimited Maps",
        "Daily personalized analyses",
        "100% Unlimited consultations with AI Oracle",
        "In-depth expanded reasoning & tailored answers",
        "Golden VIP Initiate badge on r/DestinyVox",
      ],
      button: "GET UNLIMITED ORACLE ⟶",
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
    badge: "ORÁCULO DESTINYVOX",
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
        title: "✦ DIÁLOGOS ILIMITADOS",
        desc: "Faça perguntas profundas, tire dúvidas sobre relacionamentos e explore dilemas sem limite de interação.",
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
      name: "ORÁCULO ESSENCIAL",
      badge: "ONE PAYMENT",
      price: "$9",
      period: "/month for 1 month",
      userNote: (user: string) => `Acesso para u/${user || "você"}`,
      perks: [
        "1 Mapa incluído",
        "Análises diárias personalizadas",
        "50 Consultas personalizadas com o Oráculo",
        "Análise de perguntas sobre amor, dinheiro e carreira",
        "Previsão dos 12 meses do seu Ano Pessoal",
        "Dossiê Arquetípico 360° completo incluído",
      ],
      button: "ATIVAR ORÁCULO ESSENCIAL ⟶",
      buttonLoading: "CONECTANDO AO STRIPE...",
    },
    plan2: {
      popularTag: "MAIS PROCURADO • MAPAS ILIMITADOS",
      name: "ORÁCULO ILIMITADO VIP",
      badge: "LIFESTYLE",
      price: "$19",
      period: "lifestyle",
      subText: "Perguntas sem limites para sempre",
      perks: [
        "Mapas Ilimitados",
        "Análises diárias personalizadas",
        "Consultas 100% Ilimitadas com o Oráculo IA",
        "Respostas longas e detalhadas com raciocínio expandido",
        "Selo Dourado de Iniciado VIP no r/DestinyVox",
      ],
      button: "OBTER ORÁCULO ILIMITADO ⟶",
      buttonLoading: "CONECTANDO AO STRIPE...",
    },
    footerStripe: "Pagamento Criptografado Stripe",
    footerGuarantee: "Garantia Incondicional de 7 Dias",
    footerSync: "Sincronização Instantânea com o Reddit",
    footerCopyright: `DESTINYVOX ORACLE © ${new Date().getFullYear()} — INTELIGÊNCIA CÓSMICA HERMÉTICA.`,
    modalTitle: "CONFIRME SEU USUÁRIO DO REDDIT",
    modalDesc: "Para vincular e desbloquear seu Oráculo imediatamente no aplicativo do Reddit, informe seu usuário:",
    modalPlaceholder: "ex: SeuUsuarioReddit",
    modalButton: "PROSSEGUIR PARA PAGAMENTO SEGURO ⟶",
    modalCancel: "Cancelar",
  },
  es: {
    badge: "ORÁCULO DESTINYVOX",
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
        title: "✦ DIÁLOGOS ILIMITADOS",
        desc: "Haz preguntas profundas, resuelve dudas sentimentales y analiza dilemas sin restricciones de consulta.",
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
      name: "ORÁCULO ESENCIAL",
      badge: "ONE PAYMENT",
      price: "$9",
      period: "/month for 1 month",
      userNote: (user: string) => `Acceso para u/${user || "ti"}`,
      perks: [
        "1 Carta incluida",
        "Análisis diarios personalizados",
        "50 Consultas personalizadas con el Oráculo",
        "Análisis de preguntas sobre amor, finanzas y vocación",
        "Pronóstico de los 12 meses de tu Año Personal",
        "Dossier Arquetípico 360° completo incluido",
      ],
      button: "ACTIVAR ORÁCULO ESENCIAL ⟶",
      buttonLoading: "CONECTANDO CON STRIPE...",
    },
    plan2: {
      popularTag: "MÁS POPULAR • CARTAS ILIMITADAS",
      name: "ORÁCULO ILIMITADO VIP",
      badge: "LIFESTYLE",
      price: "$19",
      period: "lifestyle",
      subText: "Preguntas sin límites para siempre",
      perks: [
        "Cartas Ilimitadas",
        "Análisis diarios personalizados",
        "Consultas 100% Ilimitadas con el Oráculo IA",
        "Respuestas extensas con razonamiento profundo",
        "Insignia Dorada de Iniciado VIP en r/DestinyVox",
      ],
      button: "OBTENER ORÁCULO ILIMITADO ⟶",
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
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const l = params.get("lang")?.toLowerCase() || sessionStorage.getItem("destinyvox_landing_lang");
        if (l === "pt" || l === "es" || l === "en") return l as Language;
      } catch {
        // ignore
      }
    }
    return "en";
  });

  const [redditUser, setRedditUser] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const u = params.get("u") || params.get("user") || params.get("reddit_user") || sessionStorage.getItem("destinyvox_landing_user") || "";
        if (u) return u.replace(/^u\//i, "").trim();
      } catch {
        // ignore
      }
    }
    return "";
  });

  const [userToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const tok = params.get("ref") || params.get("token") || sessionStorage.getItem("destinyvox_landing_ref") || "";
        if (tok) return tok.trim();
      } catch {
        // ignore
      }
    }
    return "";
  });

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<"essential" | "vip" | null>(null);
  const [modalInput, setModalInput] = useState<string>("");

  useEffect(() => {
    if (redditUser) {
      sessionStorage.setItem("destinyvox_landing_user", redditUser);
    }
    if (userToken) {
      sessionStorage.setItem("destinyvox_landing_ref", userToken);
    }
    if (lang) {
      sessionStorage.setItem("destinyvox_landing_lang", lang);
    }
  }, [redditUser, userToken, lang]);

  const t = TRANSLATIONS[lang];

  const proceedToStripe = (plan: "essential" | "vip", identifier: string) => {
    setIsRedirecting(true);

    const essentialBase =
      process.env.NEXT_PUBLIC_STRIPE_LINK_ESSENTIAL ||
      "https://buy.stripe.com/test_destinyvox_essential";
    const vipBase =
      process.env.NEXT_PUBLIC_STRIPE_LINK_VIP ||
      "https://buy.stripe.com/test_destinyvox_vip";

    const baseUrl = plan === "vip" ? vipBase : essentialBase;

    try {
      const url = new URL(baseUrl);
      if (identifier) {
        url.searchParams.set("client_reference_id", identifier);
      }
      url.searchParams.set("locale", lang);
      window.location.href = url.toString();
    } catch {
      const separator = baseUrl.includes("?") ? "&" : "?";
      const target = `${baseUrl}${separator}client_reference_id=${encodeURIComponent(
        identifier
      )}&locale=${lang}`;
      window.location.href = target;
    }
  };

  const handleCheckout = (plan: "essential" | "vip") => {
    const activeIdentifier = userToken || (redditUser ? `u_${redditUser}` : "");
    if (activeIdentifier) {
      proceedToStripe(plan, activeIdentifier);
      return;
    }

    setPendingPlan(plan);
    setModalInput("");
    setIsModalOpen(true);
  };

  const handleConfirmModalUser = () => {
    const clean = modalInput.replace(/^u\//i, "").trim();
    if (!clean) return;

    setRedditUser(clean);
    setIsModalOpen(false);

    if (pendingPlan) {
      proceedToStripe(pendingPlan, `u_${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-[#f5f5f5] selection:bg-white selection:text-black">
      {/* Modal Username */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0a] border border-neutral-800 p-6 sm:p-8 w-full max-w-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-sm tracking-widest text-white uppercase">{t.modalTitle}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <p className="font-editorial text-neutral-400 text-sm">{t.modalDesc}</p>
            <input
              type="text"
              autoFocus
              placeholder={t.modalPlaceholder}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white font-mono text-sm focus:outline-none focus:border-white"
            />
            <button
              onClick={handleConfirmModalUser}
              className="w-full bg-white text-black py-3 font-mono text-xs font-bold tracking-widest uppercase hover:bg-neutral-200"
            >
              {t.modalButton}
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Reddit Recognition */}
      {redditUser && (
        <div className="bg-[#111111] border-b border-neutral-800 py-2.5 px-4 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 font-mono text-[11px] tracking-wider text-neutral-300">
            <span className="text-amber-400">✦</span>
            <span className="text-white font-bold bg-neutral-900 border border-neutral-700 px-2 py-0.5">
              u/{redditUser}
            </span>
            <span className="hidden sm:inline text-neutral-500">{t.syncNote}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-neutral-900 px-6 sm:px-12 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-white text-base">✦</span>
          <span className="font-mono text-sm tracking-[0.3em] font-semibold text-white uppercase">
            DESTINYVOX
          </span>
          <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase border border-neutral-800 px-2 py-0.5 hidden sm:inline-block">
            {t.subBrand}
          </span>
        </div>

        <div className="flex items-center gap-5 font-mono text-xs">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 border border-neutral-800 px-2 py-1 bg-neutral-950">
            {(["en", "pt", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-1.5 py-0.5 text-[10px] tracking-wider uppercase transition-colors cursor-pointer ${
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
            className="hidden sm:inline-block bg-white text-black hover:bg-neutral-200 px-4 py-2 font-semibold tracking-widest uppercase transition-colors"
          >
            {t.navCta}
          </a>
        </div>
      </header>

      {/* Hero Section Editorial */}
      <section className="px-5 sm:px-12 pt-12 sm:pt-20 pb-12 sm:pb-16 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-950/80 px-3 py-1 font-mono text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-neutral-400 uppercase">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="sm:hidden">{t.badge}</span>
          <span className="hidden sm:inline">{t.badgeDesktop}</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-6xl md:text-7xl font-normal leading-[1.12] sm:leading-[1.08] tracking-tight text-white">
          {t.heroTitleLine1} <br />
          <span className="italic text-neutral-400">{t.heroTitleLine2}</span>
        </h1>

        <p className="font-editorial text-sm sm:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
          {t.heroDescription}
        </p>

        {/* Dynamic CTA */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 bg-white text-black hover:bg-neutral-200 font-mono text-[11px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <span>{t.ctaMain}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <span className="font-mono text-[10px] sm:text-[11px] text-neutral-500">
            {t.ctaSub}
          </span>
        </div>
      </section>

      {/* Feature Section */}
      <section className="px-4 sm:px-12 py-8 sm:py-12 max-w-5xl mx-auto">
        <div className="border border-neutral-800 bg-[#080808] p-5 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/30 px-3 sm:px-4 py-1 sm:py-1.5 font-mono text-[9px] sm:text-[10px] text-amber-300 tracking-wider sm:tracking-widest uppercase flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-400" />
            {t.featureTag}
          </div>

          <div className="space-y-2.5 sm:space-y-3 w-full pt-7 sm:pt-3">
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-neutral-500 uppercase block">
              {t.howItWorksTitle}
            </span>
            <h2 className="font-editorial text-xl sm:text-3xl text-white font-normal leading-tight">
              {t.howItWorksHeading}
            </h2>
            <p className="font-editorial text-xs sm:text-base text-neutral-400 leading-relaxed pt-1">
              {t.howItWorksDesc(redditUser)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 font-mono text-xs pt-3">
              {t.features.map((f, i) => (
                <div key={i} className="border border-neutral-800 p-3.5 sm:p-4 bg-neutral-950 space-y-1.5">
                  <span className="text-white text-[11px] sm:text-xs font-semibold block">{f.title}</span>
                  <p className="text-neutral-400 text-[10px] sm:text-[11px] font-light leading-relaxed">
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
          <span className="font-mono text-[11px] sm:text-xs tracking-[0.25em] text-neutral-500 uppercase">
            {t.pricingTag}
          </span>
          <h2 className="font-editorial text-2xl sm:text-5xl text-white font-normal">
            {t.pricingHeading}
          </h2>
          <p className="font-editorial text-xs sm:text-base text-neutral-400 max-w-md mx-auto">
            {t.pricingDesc}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto text-left">
          {/* Plano 1: Oráculo Essencial */}
          <div className="border border-neutral-800 bg-[#080808] p-5 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] sm:text-xs tracking-widest text-neutral-400 uppercase">
                  {t.plan1.name}
                </span>
                <span className="font-mono text-[9px] tracking-widest border border-neutral-800 px-2 py-0.5 text-neutral-400">
                  {t.plan1.badge}
                </span>
              </div>
              <div>
                <div className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white font-normal flex items-baseline gap-2">
                  <span>{t.plan1.price}</span>
                  <span className="text-sm sm:text-base font-mono text-neutral-500 font-light">{t.plan1.period}</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 tracking-wider">
                  {t.plan1.userNote(redditUser)}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-4 space-y-2.5 sm:space-y-3 font-mono text-[11px] sm:text-xs text-neutral-300">
                {t.plan1.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCheckout("essential")}
              disabled={isRedirecting}
              className="w-full h-11 sm:h-12 bg-white text-black hover:bg-neutral-200 font-mono text-[11px] sm:text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isRedirecting ? t.plan1.buttonLoading : t.plan1.button}</span>
            </button>
          </div>

          {/* Plano 2: Oráculo Ilimitado VIP */}
          <div className="border-2 border-white bg-[#0a0a0a] p-5 sm:p-8 space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 sm:right-6 bg-white text-black font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase px-2.5 sm:px-3 py-0.5">
              {t.plan2.popularTag}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] sm:text-xs tracking-widest text-amber-300 uppercase font-semibold">
                  {t.plan2.name}
                </span>
                <span className="font-mono text-[9px] tracking-widest border border-white px-2 py-0.5 text-white">
                  {t.plan2.badge}
                </span>
              </div>
              <div>
                <div className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white font-normal flex items-baseline gap-2">
                  <span>{t.plan2.price}</span>
                  <span className="text-sm sm:text-base font-mono text-neutral-400 capitalize font-light">{t.plan2.period}</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 tracking-wider">
                  {t.plan2.subText}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-4 space-y-2.5 sm:space-y-3 font-mono text-[11px] sm:text-xs text-neutral-200">
                {t.plan2.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className={i === 0 ? "font-semibold text-white" : ""}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCheckout("vip")}
              disabled={isRedirecting}
              className="w-full h-11 sm:h-12 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-mono text-[11px] sm:text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isRedirecting ? t.plan2.buttonLoading : t.plan2.button}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Security & Guarantee */}
      <footer className="border-t border-neutral-900 py-12 px-6 sm:px-12 text-center space-y-4 font-mono text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> {t.footerStripe}
          </span>
          <span>•</span>
          <span>{t.footerGuarantee}</span>
          <span>•</span>
          <span>{t.footerSync}</span>
        </div>
        <div className="text-[10px] text-neutral-600">
          {t.footerCopyright}
        </div>
      </footer>
    </div>
  );
}
