"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check, Heart, LoaderCircle, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import {
  calculateFullNumerology,
  formatBirthDateUS,
  getArchetype,
  toISODate,
  type NumerologyProfile,
} from "@/utils/numerology";
import { buildCosmicInterpretation, type CosmicInterpretation } from "@/utils/interpretations";
import { trackFunnelEvent, trackFunnelTransition } from "@/lib/funnelAnalytics";
import { trackRedditAddToCart } from "@/lib/redditPixel";
import { BrandLogo } from "@/components/BrandLogo";

const FULL_READING_PRICE = 27;
const LOADING_MESSAGES = [
  "Reading your numbers...",
  "Connecting the patterns...",
  "Your profile is taking shape...",
];

type FunnelStep = "entry" | "loading" | "revelation" | "deeper" | "offer" | "checkout";

function maskUsDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function getLocalTodayISO() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function Brand({ step }: { step: FunnelStep }) {
  const showProgress = ["revelation", "deeper", "offer", "checkout"].includes(step);
  const progress = step === "revelation" ? 1 : step === "deeper" ? 2 : step === "offer" || step === "checkout" ? 3 : 0;

  return (
    <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-5 sm:px-7 sm:py-7">
      <BrandLogo />
      {showProgress && (
        <div className="flex items-center gap-1.5" aria-label={`Step ${progress} of 3`}>
          {[1, 2, 3].map((item) => (
            <span key={item} className={`h-1 w-7 rounded-full transition-colors ${item <= progress ? "bg-amber-300" : "bg-white/15"}`} />
          ))}
        </div>
      )}
    </header>
  );
}

function PrimaryButton({ children, onClick, disabled = false, type = "button" }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-amber-300 px-5 py-4 font-mono text-[12px] font-bold tracking-[0.12em] text-[#15120d] shadow-[0_8px_30px_rgba(220,175,95,0.16)] transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
    >
      {children}
    </button>
  );
}

type InterpretationSlide = {
  icon: typeof Heart;
  title: string;
  number: number;
  archetype: string;
  text: string;
};

function InterpretationCarousel({ slides }: { slides: InterpretationSlide[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    const viewport = viewportRef.current;
    const slide = viewport?.children[nextIndex] as HTMLElement | undefined;
    if (!viewport || !slide) return;
    const slideLeft = slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft;
    viewport.scrollTo({ left: slideLeft, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  const updateActiveSlide = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewportLeft = viewport.getBoundingClientRect().left;
    const slides = Array.from(viewport.children) as HTMLElement[];
    const nearestIndex = slides.reduce((nearest, slide, index) =>
      Math.abs(slide.getBoundingClientRect().left - viewportLeft)
        < Math.abs(slides[nearest].getBoundingClientRect().left - viewportLeft) ? index : nearest,
    0);
    setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
  };

  return (
    <div className="mt-7" aria-roledescription="carousel" aria-label="Your three personal interpretations">
      <div
        ref={viewportRef}
        onScroll={updateActiveSlide}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {slides.map((slide, index) => (
          <div key={slide.title} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} className="min-w-0 flex-[0_0_88%] snap-start sm:flex-[0_0_58%] lg:flex-[0_0_46%]">
            <PreviewInterpretation {...slide} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] tracking-wide text-[#938c81]" aria-live="polite">0{activeIndex + 1} <span className="text-[#5f5a52]">/ 0{slides.length}</span></p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goToSlide(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous interpretation" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#c2bcb1] transition hover:border-amber-200/50 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-35">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => goToSlide(activeIndex + 1)} disabled={activeIndex === slides.length - 1} aria-label="Next interpretation" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#c2bcb1] transition hover:border-amber-200/50 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-35">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-1 font-mono text-[9px] text-[#777064]">Swipe or use the arrows to explore each interpretation.</p>
    </div>
  );
}

function PreviewInterpretation({
  icon: Icon,
  title,
  number,
  archetype,
  text,
}: {
  icon: typeof Heart;
  title: string;
  number: number;
  archetype: string;
  text: string;
}) {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const visibleParagraphs = paragraphs.slice(0, 2);
  const remainingParagraphs = paragraphs.slice(2);

  return (
    <article className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-white/[0.07] pb-4">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-amber-200/85" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] tracking-[0.17em] text-amber-100/75">NUMBER {number} · {archetype.toUpperCase()}</p>
          <h2 className="mt-1 font-editorial text-xl text-white sm:text-2xl">{title}</h2>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {visibleParagraphs.map((paragraph, index) => <p key={index} className="font-mono text-xs leading-6 text-[#c2bcb1] sm:text-[13px]">{paragraph}</p>)}
      </div>
      {remainingParagraphs.length > 0 && (
        <details className="group mt-4">
          <summary className="inline-flex min-h-10 cursor-pointer list-none items-center font-mono text-[10px] tracking-wide text-amber-100/85 transition hover:text-white [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">READ THE FULL INTERPRETATION +</span>
            <span className="hidden group-open:inline">SHOW LESS −</span>
          </summary>
          <div className="space-y-3 border-t border-white/[0.07] pt-4">
            {remainingParagraphs.map((paragraph, index) => <p key={index} className="font-mono text-xs leading-6 text-[#c2bcb1] sm:text-[13px]">{paragraph}</p>)}
          </div>
        </details>
      )}
    </article>
  );
}

export function NumerologyJourney() {
  const [step, setStep] = useState<FunnelStep>("entry");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);
  const [interpretation, setInterpretation] = useState<CosmicInterpretation | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const submitLock = useRef(false);
  const checkoutLock = useRef(false);
  const stepRef = useRef<FunnelStep>("entry");

  const goTo = (next: FunnelStep) => {
    trackFunnelTransition(stepRef.current, next);
    stepRef.current = next;
    setStep(next);
  };

  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMessage(0);
    const timer = window.setInterval(() => {
      setLoadingMessage((current) => Math.min(current + 1, LOADING_MESSAGES.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "cancelled") return;

    try {
      const saved = sessionStorage.getItem("destinyvox_discovery");
      if (!saved) return;
      const draft = JSON.parse(saved) as { name?: string; birthDate?: string; email?: string };
      if (!draft.name || !draft.birthDate) return;
      const isoBirthDate = toISODate(draft.birthDate);
      const nextProfile = calculateFullNumerology(draft.name, isoBirthDate);
      setName(draft.name);
      setBirthDate(formatBirthDateUS(isoBirthDate));
      setEmail(draft.email || "");
      setProfile(nextProfile);
      setInterpretation(buildCosmicInterpretation(nextProfile, "en"));
      stepRef.current = "checkout";
      setStep("checkout");
      setCheckoutError("Checkout wasn't completed. Your details are saved—try again when you're ready.");
    } catch {
      sessionStorage.removeItem("destinyvox_discovery");
    }
  }, []);

  const handleReveal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current) return;
    const trimmedName = name.trim().replace(/\s+/g, " ");
    let isoBirthDate = "";
    try {
      isoBirthDate = toISODate(birthDate);
    } catch {
      // Invalid and impossible dates are rejected before any numerology calculation.
    }
    const isValidDate = Boolean(isoBirthDate && isoBirthDate <= getLocalTodayISO());

    if (trimmedName.length < 2) {
      setFieldError("Enter your name to begin your reading.");
      return;
    }
    if (!isValidDate) {
      setFieldError("Choose a valid date of birth. It must be today or earlier.");
      return;
    }

    submitLock.current = true;
    setFieldError(null);
    setName(trimmedName);
    trackFunnelEvent("numerology_started");
    trackFunnelEvent("birth_data_submitted");
    goTo("loading");

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const nextProfile = calculateFullNumerology(trimmedName, isoBirthDate);
      const nextInterpretation = buildCosmicInterpretation(nextProfile, "en");
      setProfile(nextProfile);
      setInterpretation(nextInterpretation);
      try {
        sessionStorage.setItem("destinyvox_discovery", JSON.stringify({ name: trimmedName, birthDate: isoBirthDate }));
      } catch {
        // Discovery still works if browser storage is unavailable.
      }
      trackFunnelEvent("numerology_result_received");
      trackFunnelEvent("reading_preview_viewed");
      goTo("revelation");
    } catch {
      setFieldError("We couldn't complete your reading right now. Please try again.");
      goTo("entry");
    } finally {
      submitLock.current = false;
    }
  };

  const openOffer = () => {
    trackFunnelEvent("offer_viewed");
    goTo("offer");
  };

  const beginCheckout = () => {
    setCheckoutError(null);
    trackFunnelEvent("checkout_started", { value: FULL_READING_PRICE, currency: "USD" });
    trackRedditAddToCart({
      value: FULL_READING_PRICE,
      currency: "USD",
      plan: "complete_numerology_reading",
    });
    goTo("checkout");
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkoutLock.current || !profile) return;
    checkoutLock.current = true;
    setIsCheckoutLoading(true);
    setCheckoutError(null);

    try {
      sessionStorage.setItem("destinyvox_discovery", JSON.stringify({ name, birthDate: toISODate(birthDate), email: email.trim() }));
    } catch {
      // Stripe session metadata preserves the information needed to fulfill the order.
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthDate: toISODate(birthDate),
          email: email.trim(),
          plan: "complete_numerology_reading",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || "We couldn't open checkout. Please try again.");
      }
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      checkoutLock.current = false;
      setIsCheckoutLoading(false);
    }
  };

  const archetype = profile ? getArchetype(profile.lifePath, "en") : null;
  const firstName = name.split(/\s+/)[0] || "friend";
  const firstReveal = interpretation?.destinyOverview
    .split(/\n\s*\n/)[0]
    .match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]
    .trim();

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0908] text-[#f6f2eb] selection:bg-amber-300 selection:text-black">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="journey-glow absolute -top-64 left-1/2 h-[35rem] w-[48rem] -translate-x-1/2 rounded-full" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <Brand step={step} />

        <main className={`mx-auto flex w-full flex-1 flex-col justify-center px-5 pb-12 sm:px-7 sm:pb-16 ${step === "deeper" ? "max-w-5xl" : "max-w-xl"}`}>
          {step === "entry" && (
            <section className="journey-enter">
              <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-amber-200/80 sm:text-[11px]">
                <span className="h-px w-7 bg-amber-300/60" />
                A PERSONAL NUMEROLOGY EXPERIENCE
              </div>
              <h1 className="max-w-lg font-editorial text-[2.65rem] leading-[1.08] tracking-[-0.035em] text-white sm:text-6xl">
                What does your birth date <span className="italic text-amber-200">reveal about you?</span>
              </h1>
              <p className="mt-4 max-w-md font-mono text-sm leading-6 text-[#b6b0a5] sm:text-base">
                Discover your personal numerology profile.
              </p>

              <form onSubmit={handleReveal} className="mt-9 space-y-5" noValidate>
                <div>
                  <label htmlFor="birth-name" className="mb-2 block font-mono text-xs tracking-wide text-[#d5d0c6]">Your name</label>
                  <div className="relative">
                    <UserRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777064]" />
                    <input
                      id="birth-name"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => { setName(event.target.value); setFieldError(null); }}
                      placeholder="Enter your name"
                      maxLength={100}
                      className="min-h-[54px] w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 font-mono text-sm text-white placeholder:text-[#716b61] outline-none transition focus:border-amber-200/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-amber-200/10"
                      aria-invalid={Boolean(fieldError && name.trim().length < 2)}
                      aria-describedby={fieldError ? "entry-error" : undefined}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="birth-date" className="mb-2 block font-mono text-xs tracking-wide text-[#d5d0c6]">Date of birth</label>
                  <input
                    id="birth-date"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    placeholder="MM/DD/YYYY"
                    pattern="(0?[1-9]|1[0-2])/(0?[1-9]|[12][0-9]|3[01])/[0-9]{4}"
                    maxLength={10}
                    value={birthDate}
                    onChange={(event) => { setBirthDate(maskUsDateInput(event.target.value)); setFieldError(null); }}
                    className="min-h-[54px] w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 font-mono text-sm text-white outline-none transition placeholder:text-[#716b61] focus:border-amber-200/60 focus:bg-white/[0.055] focus:ring-2 focus:ring-amber-200/10"
                    aria-invalid={Boolean(fieldError && !birthDate)}
                    aria-describedby={fieldError ? "entry-error" : undefined}
                    required
                  />
                  <p className="mt-2 font-mono text-[10px] text-[#837d72]">Use month / day / year (MM/DD/YYYY).</p>
                </div>

                {fieldError && <p id="entry-error" role="alert" className="font-mono text-xs leading-5 text-rose-300">{fieldError}</p>}

                <div className="pt-1">
                  <PrimaryButton type="submit">REVEAL MY NUMBER <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></PrimaryButton>
                  <p className="mt-3 text-center font-mono text-[10px] leading-5 text-[#777064]">
                    Your reading is generated from your personal birth information.
                  </p>
                </div>
              </form>
            </section>
          )}

          {step === "loading" && (
            <section className="journey-enter flex flex-col items-center py-20 text-center" aria-live="polite" aria-busy="true">
              <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-amber-200/20 bg-amber-100/[0.035]">
                <span className="absolute inset-2 animate-pulse rounded-full border border-amber-200/10" />
                <Sparkles className="h-7 w-7 text-amber-200" strokeWidth={1.3} />
              </div>
              <p className="font-editorial text-2xl text-white sm:text-3xl">{LOADING_MESSAGES[loadingMessage]}</p>
              <p className="mt-3 font-mono text-xs text-[#837d72]">A moment for your personal profile</p>
            </section>
          )}

          {step === "revelation" && profile && archetype && (
            <section className="journey-enter text-center">
              <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80">YOUR FIRST REVELATION</p>
              <p className="mt-8 font-mono text-[11px] tracking-[0.2em] text-[#9e978b]">{firstName.toUpperCase()} · YOUR LIFE PATH NUMBER</p>
              <div className="number-reveal mx-auto mt-2 font-editorial text-[9rem] leading-none tracking-[-0.07em] text-amber-100 sm:text-[11rem]" aria-label={`Life Path Number ${profile.lifePath}`}>
                {profile.lifePath}
              </div>
              <p className="mt-4 font-editorial text-2xl text-white sm:mt-5 sm:text-3xl">{archetype.title}</p>
              <p className="mx-auto mt-5 max-w-md font-mono text-sm leading-7 text-[#c2bcb1] sm:text-base">
                {firstReveal || interpretation?.destinyOverview}
              </p>
              <p className="mt-4 font-mono text-[10px] leading-5 text-[#777064]">In numerology, this number is traditionally read as a lens for self-reflection.</p>
              <div className="mx-auto mt-8 max-w-sm">
                <PrimaryButton onClick={() => goTo("deeper")}>EXPLORE MY PROFILE <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></PrimaryButton>
              </div>
            </section>
          )}

          {step === "deeper" && profile && interpretation && (
            <section className="journey-enter">
              <button onClick={() => goTo("revelation")} className="mb-7 inline-flex items-center gap-2 py-2 font-mono text-[10px] tracking-wide text-[#938c81] transition hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> BACK TO YOUR NUMBER
              </button>
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80">THERE’S MORE TO YOUR PROFILE</p>
              <h1 className="mt-3 font-editorial text-4xl leading-tight tracking-[-0.025em] text-white sm:text-5xl">
                Your Life Path is one part of your story.
              </h1>
              <p className="mt-4 font-mono text-sm leading-6 text-[#b6b0a5]">
                Your birth date and name each reveal a different part of your profile. Explore your path, natural strengths, and the patterns you can grow through.
              </p>

              <InterpretationCarousel
                slides={[
                  { icon: Heart, title: "Your path and purpose", number: profile.lifePath, archetype: getArchetype(profile.lifePath, "en").title, text: interpretation.destinyOverview },
                  { icon: BriefcaseBusiness, title: "The strengths in your name", number: profile.expression, archetype: getArchetype(profile.expression, "en").title, text: interpretation.hiddenTalents },
                  { icon: Sparkles, title: "Your challenges and growth", number: profile.lifePath, archetype: getArchetype(profile.lifePath, "en").title, text: interpretation.shadowAndChallenges },
                ]}
              />

              <div className="mt-7">
                <PrimaryButton onClick={openOffer}>SEE MY COMPLETE READING <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></PrimaryButton>
              </div>
            </section>
          )}

          {step === "offer" && profile && interpretation && (
            <section className="journey-enter">
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button onClick={() => goTo("deeper")} className="inline-flex items-center gap-2 py-2 font-mono text-[10px] tracking-wide text-[#938c81] transition hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" /> BACK TO YOUR PROFILE
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-100/[0.045] px-3 py-1.5 font-mono text-[9px] tracking-[0.14em] text-amber-100/85">
                  <Sparkles className="h-3.5 w-3.5" /> PERSONALIZED FOR {firstName.toUpperCase()}
                </div>
              </div>
              <h1 className="font-editorial text-[2.6rem] leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
                Discover your complete numerology profile.
              </h1>
              <p className="mt-4 font-mono text-sm leading-6 text-[#b6b0a5]">
                Go beyond your Life Path Number. Explore the deeper patterns connected to your name and birth date in a complete digital reading.
              </p>

              <div className="my-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Heart, title: "Relationships", text: interpretation.destinyOverview },
                  { icon: BriefcaseBusiness, title: "Work & money", text: interpretation.hiddenTalents },
                  { icon: Sparkles, title: "Challenges & growth", text: interpretation.shadowAndChallenges },
                  { icon: CalendarDays, title: "Your current life cycle", text: interpretation.yearlyForecast },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="relative overflow-hidden rounded-xl border border-white/[0.085] bg-white/[0.025] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-amber-200/80" strokeWidth={1.5} />
                      <h2 className="font-mono text-xs font-medium text-white">{title}</h2>
                      <LockKeyhole className="ml-auto h-3.5 w-3.5 text-[#746d63]" />
                    </div>
                    <p aria-hidden="true" className="mt-3 select-none overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-[#9b9489] blur-[3px]">
                      {text.split(/\n\s*\n/)[0]?.slice(0, 128)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                <ul className="space-y-4">
                  {[
                    "Your complete 8-number numerology profile",
                    "Personal readings for strengths, inner patterns, and challenges",
                    "Relationship and work themes found across your numbers",
                    "Your current personal-year cycle and guidance",
                    "Explore online, with a personalized PDF to keep",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 font-mono text-xs leading-5 text-[#ded8cd] sm:text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" strokeWidth={2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-end justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.17em] text-[#8f887d]">COMPLETE PERSONAL NUMEROLOGY READING</p>
                  <p className="mt-2 font-mono text-[10px] text-[#8f887d]">One-time payment</p>
                </div>
                <p className="font-editorial text-4xl text-white">$27</p>
              </div>
              <div className="mt-5">
                <PrimaryButton onClick={beginCheckout}>UNLOCK MY FULL READING <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></PrimaryButton>
                <p className="mt-3 text-center font-mono text-[10px] text-[#777064]">Secure checkout · No account or subscription</p>
              </div>
            </section>
          )}

          {step === "checkout" && profile && (
            <section className="journey-enter">
              <button onClick={() => goTo("offer")} className="mb-7 inline-flex items-center gap-2 py-2 font-mono text-[10px] tracking-wide text-[#938c81] transition hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> BACK TO YOUR READING
              </button>
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80">YOUR COMPLETE PERSONAL READING</p>
              <h1 className="mt-3 font-editorial text-4xl leading-tight text-white sm:text-5xl">Where should we send your reading?</h1>
              <p className="mt-4 font-mono text-sm leading-6 text-[#b6b0a5]">Enter your email to continue to secure checkout. Your birth name and date are already part of your profile.</p>

              <form onSubmit={handleCheckout} className="mt-7 space-y-4">
                <label htmlFor="reading-email" className="block font-mono text-xs text-[#d5d0c6]">Email address</label>
                <input
                  id="reading-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setCheckoutError(null); }}
                  placeholder="you@example.com"
                  className="min-h-[54px] w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 font-mono text-sm text-white placeholder:text-[#716b61] outline-none transition focus:border-amber-200/60 focus:ring-2 focus:ring-amber-200/10"
                />
                {checkoutError && <p role="alert" className="font-mono text-xs leading-5 text-rose-300">{checkoutError}</p>}

                <div className="flex items-center justify-between border-y border-white/10 py-4 font-mono text-xs">
                  <span className="text-[#b6b0a5]">Your Personal Numerology Reading</span>
                  <span className="text-white">$27.00</span>
                </div>
                <PrimaryButton type="submit" disabled={isCheckoutLoading}>
                  {isCheckoutLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> OPENING SECURE CHECKOUT...</> : <>CONTINUE TO SECURE CHECKOUT <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </PrimaryButton>
                <p className="text-center font-mono text-[10px] leading-5 text-[#777064]">One-time payment of $27 · Your reading and personalized PDF are included.</p>
              </form>
            </section>
          )}
        </main>

        <footer className="relative z-10 mx-auto w-full max-w-xl px-5 pb-6 text-center font-mono text-[9px] text-[#625d55] sm:px-7">
          NUMEROLOGY IS A PERSONAL REFLECTION PRACTICE.
        </footer>
      </div>
    </div>
  );
}
