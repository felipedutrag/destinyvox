import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { NumerologyPDFDocument } from "@/app/api/deliver/PdfTemplate";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramPixNotification } from "@/lib/telegram";
import {
  calculateLifePath,
  calculateExpression,
  calculateSoulUrge,
  calculatePersonality,
  calculatePersonalYear,
  calculateBirthday,
  calculateMaturity,
  calculatePersonalMonth,
  calculatePersonalDay,
  getArchetype,
  getSoulDictum,
  parseBirthDate,
} from "@/utils/numerology";

import {
  LIFE_PATH_INTERPRETATIONS,
  EXPRESSION_INTERPRETATIONS,
  SOUL_URGE_INTERPRETATIONS,
  PERSONALITY_INTERPRETATIONS,
  SHADOW_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS,
  BIRTHDAY_INTERPRETATIONS,
  MATURITY_INTERPRETATIONS,
  interpolateFirstName,
  extractFirstName,
} from "@/utils/interpretations";

export interface GematriaLetter {
  char: string;
  value: number;
  isVowel: boolean;
}

export interface GematriaWord {
  word: string;
  letters: GematriaLetter[];
  sum: number;
  additionString: string;
  reductionString: string;
}

export interface NumerologyPillarData {
  number: number;
  label: string;
  archetype: string;
  element: string;
  keywords: string;
  dictum?: string;
  paragraphs: string[];
}

export interface NumerologyContent {
  profile: {
    fullName: string;
    firstName: string;
    birthDate: string;
  };
  gematria: {
    words: GematriaWord[];
    vowelsSum: number;
    consonantsSum: number;
    totalSum: number;
    soulUrgeNumber: number;
    personalityNumber: number;
    expressionNumber: number;
    dateCalculationString: string;
    vowelsAdditionString: string;
    consonantsAdditionString: string;
    totalAdditionString: string;
    explanation: string;
  };
  pillars: {
    lifePath: NumerologyPillarData;
    expression: NumerologyPillarData;
    soulUrge: NumerologyPillarData;
    personality: NumerologyPillarData;
    personalYear: NumerologyPillarData;
    birthday: NumerologyPillarData;
    maturity: NumerologyPillarData;
  };
  shadow: {
    number: number;
    label: string;
    title: string;
    paragraphs: string[];
    transmutation: string[];
  };
  activation: {
    abundanceCode: string;
    manifestationDecree: string;
  };
  orderBumps?: {
    karmicDebt?: KarmicDebtAnalysis;
    personalYearMonths?: PersonalYearMonthsAnalysis;
  };
}

export interface KarmicDebtItem {
  number: number;
  transmutedTo: number;
  title: string;
  theme: string;
  diagnosis: string;
  symptoms: string;
  protocol: string;
}

export interface KarmicDebtAnalysis {
  active: boolean;
  identifiedDebts: number[];
  statusText: string;
  items: KarmicDebtItem[];
  manifestationDecree: string;
}

export interface PersonalMonthItem {
  monthIndex: number;
  monthName: string;
  personalMonthNumber: number;
  archetype: string;
  theme: string;
  guidance: string;
}

export interface PersonalYearMonthsAnalysis {
  active: boolean;
  personalYear: number;
  yearArchetype: string;
  months: PersonalMonthItem[];
  executiveAdvice: string;
}


const PYTHAGOREAN_MAP: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};
const VOWELS_SET = new Set(["a", "e", "i", "o", "u"]);

function calculateGematriaBreakdown(name: string, birthDate: string, soulUrgeNum: number, persNum: number, expNum: number) {
  const normalizedWords = name.trim().split(/\s+/).filter(Boolean);
  let vowelsSum = 0;
  let consonantsSum = 0;
  let totalSum = 0;
  const allVowels: GematriaLetter[] = [];
  const allConsonants: GematriaLetter[] = [];

  const words: GematriaWord[] = normalizedWords.map((word) => {
    let wordSum = 0;
    const letters: GematriaLetter[] = [];
    const normWord = word
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (let i = 0; i < normWord.length; i++) {
      const char = normWord[i];
      const val = PYTHAGOREAN_MAP[char];
      if (val !== undefined) {
        const isVowel = VOWELS_SET.has(char);
        const letterObj: GematriaLetter = {
          char: word[i] ? word[i].toUpperCase() : char.toUpperCase(),
          value: val,
          isVowel,
        };
        letters.push(letterObj);
        wordSum += val;
        totalSum += val;
        if (isVowel) {
          vowelsSum += val;
          allVowels.push(letterObj);
        } else {
          consonantsSum += val;
          allConsonants.push(letterObj);
        }
      }
    }

    const additionString = letters.map((l) => `${l.char}(${l.value})`).join(" + ") + (letters.length > 0 ? ` = ${wordSum}` : "");
    let redWord = wordSum;
    let reductionString = `${wordSum}`;
    while (redWord > 9 && redWord !== 11 && redWord !== 22 && redWord !== 33) {
      const parts = redWord.toString().split("");
      const next = parts.reduce((acc, d) => acc + parseInt(d, 10), 0);
      reductionString += ` ➔ ${parts.join(" + ")} = ${next}`;
      redWord = next;
    }

    return {
      word: word.toUpperCase(),
      letters,
      sum: wordSum,
      additionString,
      reductionString,
    };
  });

  // Cálculo da data com +
  const digits = birthDate.replace(/[^0-9]/g, "");
  let dateCalculationString = "";
  if (digits.length >= 8) {
    const digitSumString = digits.split("").join(" + ");
    const sumDigits = digits.split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
    dateCalculationString = `${digitSumString} = ${sumDigits}`;
    let cur = sumDigits;
    while (cur > 9 && cur !== 11 && cur !== 22 && cur !== 33) {
      const parts = cur.toString().split("");
      const next = parts.reduce((acc, d) => acc + parseInt(d, 10), 0);
      dateCalculationString += ` ➔ ${parts.join(" + ")} = ${next}`;
      cur = next;
    }
  }

  const vowelsAdditionString = allVowels.length > 0
    ? allVowels.map((l) => `${l.char}(${l.value})`).join(" + ") + ` = ${vowelsSum} ➔ ${soulUrgeNum}`
    : `Total: ${vowelsSum} ➔ ${soulUrgeNum}`;

  const consonantsAdditionString = allConsonants.length > 0
    ? allConsonants.map((l) => `${l.char}(${l.value})`).join(" + ") + ` = ${consonantsSum} ➔ ${persNum}`
    : `Total: ${consonantsSum} ➔ ${persNum}`;

  const totalAdditionString = `Vogais (${soulUrgeNum}) + Consoantes (${persNum}) = ${soulUrgeNum + persNum} ➔ ${expNum}`;

  return {
    words,
    vowelsSum,
    consonantsSum,
    totalSum,
    dateCalculationString,
    vowelsAdditionString,
    consonantsAdditionString,
    totalAdditionString,
  };
}

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada");
  return new Resend(key);
};

export async function generateNumerologyContent(
  name: string,
  birthDate: string,
  orderBumpsOption?: { karmicDebt?: boolean; personalYearMonths?: boolean }
): Promise<NumerologyContent> {
  const firstName = extractFirstName(name);
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(name);
  const soulUrge = calculateSoulUrge(name);
  const personality = calculatePersonality(name);
  const birthday = calculateBirthday(birthDate);
  const maturity = calculateMaturity(lifePath, expression);
  const personalYear = calculatePersonalYear(birthDate, 2026);

  const lpArchetype = getArchetype(lifePath, "en");
  const expArchetype = getArchetype(expression, "en");
  const suArchetype = getArchetype(soulUrge, "en");
  const persArchetype = getArchetype(personality, "en");
  const yearArchetype = getArchetype(personalYear, "en");
  const bdayArchetype = getArchetype(birthday, "en");
  const matArchetype = getArchetype(maturity, "en");

  const gematria = calculateGematriaBreakdown(name, birthDate, soulUrge, personality, expression);

  const getParagraphs = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return interpolateFirstName(raw, name)
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);
  };

  const lpParagraphs = getParagraphs(LIFE_PATH_INTERPRETATIONS.en[lifePath] || LIFE_PATH_INTERPRETATIONS.en[1]);
  const expParagraphs = getParagraphs(EXPRESSION_INTERPRETATIONS.en[expression] || EXPRESSION_INTERPRETATIONS.en[1]);
  const suParagraphs = getParagraphs(SOUL_URGE_INTERPRETATIONS.en[soulUrge] || SOUL_URGE_INTERPRETATIONS.en[1]);
  const persParagraphs = getParagraphs(PERSONALITY_INTERPRETATIONS.en[personality] || PERSONALITY_INTERPRETATIONS.en[1]);
  const yearParagraphs = getParagraphs(YEARLY_FORECAST_INTERPRETATIONS.en[personalYear] || YEARLY_FORECAST_INTERPRETATIONS.en[1]);
  const bdayParagraphs = getParagraphs(BIRTHDAY_INTERPRETATIONS.en[birthday] || BIRTHDAY_INTERPRETATIONS.en[1]);
  const matParagraphs = getParagraphs(MATURITY_INTERPRETATIONS.en[maturity] || MATURITY_INTERPRETATIONS.en[1]);

  const shadowRaw = SHADOW_INTERPRETATIONS.en[lifePath] || SHADOW_INTERPRETATIONS.en[1] || "";
  const shadowAll = getParagraphs(shadowRaw);
  const shadowParagraphs = shadowAll.slice(0, 4);
  const shadowTransmutation = shadowAll.slice(4);

  return {
    profile: {
      fullName: name,
      firstName,
      birthDate,
    },
    gematria: {
      words: gematria.words,
      vowelsSum: gematria.vowelsSum,
      consonantsSum: gematria.consonantsSum,
      totalSum: gematria.totalSum,
      soulUrgeNumber: soulUrge,
      personalityNumber: personality,
      expressionNumber: expression,
      dateCalculationString: gematria.dateCalculationString,
      vowelsAdditionString: gematria.vowelsAdditionString,
      consonantsAdditionString: gematria.consonantsAdditionString,
      totalAdditionString: gematria.totalAdditionString,
      explanation: `The vibrational signature of ${name} decomposed according to the Pythagorean table reveals the dynamic of ${gematria.totalSum} materialization energy points.`,
    },
    pillars: {
      lifePath: {
        number: lifePath,
        label: "Life Path (Central Destiny)",
        archetype: lpArchetype.title,
        element: lpArchetype.element,
        keywords: lpArchetype.keyword,
        dictum: getSoulDictum(lifePath, "en"),
        paragraphs: lpParagraphs,
      },
      expression: {
        number: expression,
        label: "Expression (Mark on the World)",
        archetype: expArchetype.title,
        element: expArchetype.element,
        keywords: expArchetype.keyword,
        dictum: getSoulDictum(expression, "en"),
        paragraphs: expParagraphs,
      },
      soulUrge: {
        number: soulUrge,
        label: "Soul Urge (Inner Motivation)",
        archetype: suArchetype.title,
        element: suArchetype.element,
        keywords: suArchetype.keyword,
        dictum: getSoulDictum(soulUrge, "en"),
        paragraphs: suParagraphs,
      },
      personality: {
        number: personality,
        label: "Outer Personality (Social Filter)",
        archetype: persArchetype.title,
        element: persArchetype.element,
        keywords: persArchetype.keyword,
        dictum: getSoulDictum(personality, "en"),
        paragraphs: persParagraphs,
      },
      personalYear: {
        number: personalYear,
        label: "Current Personal Year (2026)",
        archetype: yearArchetype.title,
        element: yearArchetype.element,
        keywords: yearArchetype.keyword,
        dictum: getSoulDictum(personalYear, "en"),
        paragraphs: yearParagraphs,
      },
      birthday: {
        number: birthday,
        label: "Innate Talent (Day of Birth)",
        archetype: bdayArchetype.title,
        element: bdayArchetype.element,
        keywords: bdayArchetype.keyword,
        paragraphs: bdayParagraphs,
      },
      maturity: {
        number: maturity,
        label: "Maturity Mission (35+ Years)",
        archetype: matArchetype.title,
        element: matArchetype.element,
        keywords: matArchetype.keyword,
        paragraphs: matParagraphs,
      },
    },
    shadow: {
      number: lifePath,
      label: "Challenge & Karmic Alchemy",
      title: `The Shadow of ${lpArchetype.title}`,
      paragraphs: shadowParagraphs,
      transmutation: shadowTransmutation,
    },
    activation: {
      abundanceCode: `${lifePath} • ${expression} • ${soulUrge} — 2026`,
      manifestationDecree: "I acknowledge the sovereignty of my vibrational matrix. I align my thoughts to the frequency of universal order and activate the inexhaustible flow of wisdom, prosperity, and purpose. The codes of my destiny are open.",
    },
    orderBumps: {
      karmicDebt: orderBumpsOption?.karmicDebt
        ? generateKarmicDebtData(name, birthDate, lifePath, expression, soulUrge)
        : undefined,
      personalYearMonths: orderBumpsOption?.personalYearMonths
        ? generatePersonalYearMonthsData(personalYear)
        : undefined,
    },
  };
}

function generateKarmicDebtData(name: string, birthDate: string, lifePath: number, expression: number, soulUrge: number): KarmicDebtAnalysis {
  const { day } = parseBirthDate(birthDate);
  const identifiedDebts: number[] = [];
  if ([13, 14, 16, 19].includes(day)) identifiedDebts.push(day);

  const items: KarmicDebtItem[] = [
    {
      number: 13,
      transmutedTo: 4,
      title: "Karmic Debt 13 — Work and Matter",
      theme: "Transmutation of Effort into Solid Achievement",
      diagnosis: "In previous incarnations there was neglect of essential duties, seeking easy shortcuts, laziness, or burdening others for personal benefit.",
      symptoms: "Persistent feeling of having to work twice as hard to reap the same as others; repetitive obstacles and a sense of starting from scratch.",
      protocol: "Cultivate impeccable order, loyalty to processes, and ethical perseverance. Every deliberate effort without resentment dissolves the debt and anchors unshakeable abundance.",
    },
    {
      number: 14,
      transmutedTo: 5,
      title: "Karmic Debt 14 — Freedom and Temperance",
      theme: "Self-mastery of the Senses and Conscious Moderation",
      diagnosis: "Ancestral records of sensory excesses, addictions, irresponsible waste of vital force, or deprivation of the freedom of others.",
      symptoms: "Financial and emotional roller coaster, abrupt changes, and unexpected losses whenever the individual gets lost in impulsivity.",
      protocol: "Embrace the sacred virtue of Temperance. Maintain firm long-term commitments and channel your thirst for adventure into the evolution of consciousness.",
    },
    {
      number: 16,
      transmutedTo: 7,
      title: "Karmic Debt 16 — The Fall of the Tower and Awakening",
      theme: "Destruction of Egoic Pride and Illumination of the Soul",
      diagnosis: "Memories of intellectual arrogance, breaking of sacred emotional pacts, or manipulation of others' trust in past lives.",
      symptoms: "Sudden collapses of projects built on personal vanity; dramatic romantic disillusionments intended to strip the ego of its illusions.",
      protocol: "Unconditional humility and dedication to the eternal values of the spirit. By accepting that the divine governs the universe, you are reborn invulnerable.",
    },
    {
      number: 19,
      transmutedTo: 1,
      title: "Karmic Debt 19 — Power and Compassionate Sovereignty",
      theme: "Fair Leadership and Overcoming Isolation",
      diagnosis: "Tyrannical use of authority, enrichment at the expense of the vulnerable, or refusal to extend a hand to fellow beings.",
      symptoms: "A sense of existential loneliness, extreme difficulty in asking for help, and a feeling that no one supports you in difficult times.",
      protocol: "Practice generous leadership and empathetic listening. Use your strength and intelligence to uplift those you lead. Mutual forgiveness extinguishes this cycle.",
    },
  ];

  const hasDebt = identifiedDebts.length > 0;
  const statusText = hasDebt
    ? `We have identified the direct incidence of Karmic Debt ${identifiedDebts.join(", ")} on your day of birth (${day}). Your priority rectification protocol should focus on this coordinate.`
    : `Your primary matrix does not present direct debts in the fundamental pillars. This dossier acts as a preventive hermetic protocol and purification of ancestral memories.`;

  return {
    active: true,
    identifiedDebts,
    statusText,
    items,
    manifestationDecree: "I revoke, transmute, and dissolve every archaic contract of scarcity, pride, or neglect. I assume mastery of my consciousness in the here and now. All my debts with the cosmos are declared settled in light, love, and truth.",
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_THEMES: Record<number, { theme: string; guidance: string; archetype: string }> = {
  1: { archetype: "The Pioneer", theme: "Beginnings and Leadership", guidance: "Excellent for launching new projects, opening businesses, making autonomous decisions, and signing new contracts." },
  2: { archetype: "The Mediator", theme: "Partnerships and Patience", guidance: "Time to cultivate strategic alliances, negotiate agreements with diplomacy, and avoid hasty confrontations." },
  3: { archetype: "The Communicator", theme: "Expansion and Visibility", guidance: "Total focus on marketing, sales, networking, and social projection. Avoid resource dispersion." },
  4: { archetype: "The Builder", theme: "Work and Structuring", guidance: "Month to put your house in order, financial auditing, cut superfluous expenses, and build solid foundations." },
  5: { archetype: "The Explorer", theme: "Change and Movement", guidance: "Open window for travel, career pivots, flexibility, and rapid adaptation to unforeseen events." },
  6: { archetype: "The Harmonizer", theme: "Team and Responsibility", guidance: "Prioritize family harmony and the loyalty of your team. Good time for real estate investments." },
  7: { archetype: "The Seeker", theme: "Introspection and Analysis", guidance: "Month of tactical retreat and study. Avoid risky investments; privilege strategic reflection." },
  8: { archetype: "The Sovereign", theme: "Harvest and Material Power", guidance: "Peak of financial manifestation! Time to collect debts, negotiate raises, and close major deals." },
  9: { archetype: "The Sage", theme: "Conclusion and Detachment", guidance: "Close worn-out cycles, forgive pending issues, and prepare the ground for the new. Do not start major projects now." },
};

function generatePersonalYearMonthsData(personalYear: number): PersonalYearMonthsAnalysis {
  const months: PersonalMonthItem[] = MONTH_NAMES.map((monthName, idx) => {
    const monthNum = idx + 1;
    let sum = personalYear + monthNum;
    while (sum > 9) {
      sum = sum.toString().split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
    }
    const themeInfo = MONTH_THEMES[sum] || MONTH_THEMES[1];
    return {
      monthIndex: monthNum,
      monthName,
      personalMonthNumber: sum,
      archetype: themeInfo.archetype,
      theme: themeInfo.theme,
      guidance: themeInfo.guidance,
    };
  });

  return {
    active: true,
    personalYear,
    yearArchetype: getArchetype(personalYear, "en").title,
    months,
    executiveAdvice: `In Personal Year ${personalYear}, the months of greatest material harvest and financial leverage coincide with Personal Months 1, 3, and 8. Use Personal Months 4 and 7 to organize the foundations and protect your assets.`,
  };
}

export interface DeliverMapParams {
  name: string;
  email: string;
  birthDate: string;
  transactionId?: string | null;
  externalId?: string | null;
  amountCents?: number;
  plan?: string;
  orderBumps?: {
    karmicDebt?: boolean;
    personalYearMonths?: boolean;
  };
}

/**
 * Processamento completo e idempotente da entrega do Mapa Pitagórico:
 * 1. Verifica se o mapa já foi gerado para este pagamento (evita duplicidade).
 * 2. Gera os cálculos e a interpretação completa via Gemini.
 * 3. Cria/recupera o usuário no Supabase Auth e salva em `numerology_maps`.
 * 4. Atualiza `payments` com status PAID e vínculo com o mapa.
 * 5. Compila o PDF estético Dark Tech.
 * 6. Envia por e-mail com Resend.
 * 7. Envia notificação em tempo real no Telegram.
 */
export async function deliverNumerologyMap(params: DeliverMapParams) {
  const customerName = params.name.trim() || "Cliente";
  const customerEmail = params.email.trim().toLowerCase();
  const birthDateRaw = params.birthDate.trim();

  if (!customerEmail) {
    throw new Error("E-mail do cliente é obrigatório");
  }

  const supabase = getSupabaseAdmin();

  // 1. Verificação de Idempotência: Checar se o pagamento já possui um mapa associado ou e-mail enviado
  let matchedPaymentId: string | null = null;
  if (params.transactionId || params.externalId) {
    const query = supabase.from("payments").select("id, map_id, status, metadata");
    if (params.transactionId) {
      query.eq("transaction_id", String(params.transactionId));
    } else if (params.externalId) {
      query.eq("external_id", params.externalId);
    }
    const { data: existingPayment } = await query.maybeSingle();

    if (existingPayment) {
      matchedPaymentId = existingPayment.id;
      const meta = (existingPayment.metadata || {}) as Record<string, unknown>;

      if (existingPayment.map_id || meta.email_sent || meta.delivering) {
        console.log(`[Deliver] 🛑 Entrega já realizada ou em andamento para o pagamento ${existingPayment.id}. Evitando envio de e-mail duplicado.`);
        return {
          success: true,
          alreadyDelivered: true,
          mapId: existingPayment.map_id,
        };
      }

      // Trava atômica imediata para evitar disparos simultâneos (Webhook + Frontend)
      await supabase
        .from("payments")
        .update({
          metadata: {
            ...meta,
            delivering: true,
            delivery_started_at: new Date().toISOString(),
          },
        })
        .eq("id", existingPayment.id);
    }
  }

  // Formatar data para exibição e cálculos estritamente no padrão brasileiro (DD/MM/AAAA)
  const parsedBirth = parseBirthDate(birthDateRaw || "01/01/1990");
  const birthDate = `${String(parsedBirth.day).padStart(2, "0")}/${String(parsedBirth.month).padStart(2, "0")}/${parsedBirth.year}`;

  let orderBumps = params.orderBumps;
  if (!orderBumps && params.externalId) {
    const hasKD = params.externalId.includes("KD1");
    const hasPY = params.externalId.includes("PY1");
    if (hasKD || hasPY) {
      orderBumps = {
        karmicDebt: hasKD,
        personalYearMonths: hasPY,
      };
    }
  }

  // Em modo de desenvolvimento ou fallback de teste, ativamos ambos para inspeção visual completa do PDF
  if (process.env.NODE_ENV !== "production" && !orderBumps) {
    orderBumps = {
      karmicDebt: true,
      personalYearMonths: true,
    };
  }

  console.log(`✨ [Deliver] Gerando conteúdo do Mapa Pitagórico para ${customerName}... Order Bumps:`, orderBumps);
  const numerologyData = await generateNumerologyContent(customerName, birthDate, orderBumps);

  // Cálculos numéricos completos
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(customerName);
  const soulUrge = calculateSoulUrge(customerName);
  const personality = calculatePersonality(customerName);
  const birthday = calculateBirthday(birthDate);
  const maturity = calculateMaturity(lifePath, expression);
  const personalYear = calculatePersonalYear(birthDate, 2026);
  const personalMonth = calculatePersonalMonth(personalYear);
  const personalDay = calculatePersonalDay(personalMonth);
  const archetype = getArchetype(lifePath, "en");
  const dictum = getSoulDictum(lifePath, "en");

  // 2. Verificar ou Criar Usuário no Supabase Auth
  let userId: string | null = null;
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingAuthUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === customerEmail
    );

    if (existingAuthUser) {
      userId = existingAuthUser.id;
    } else {
      const { data: newAuthUser, error: authErr } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          birth_date: birthDate,
        },
      });
      if (newAuthUser?.user) {
        userId = newAuthUser.user.id;
        console.log(`[Supabase Auth] Novo usuário criado: ${userId}`);
      } else if (authErr) {
        console.warn("[Supabase Auth] Aviso ao criar usuário:", authErr.message);
      }
    }
  } catch (authError) {
    console.warn("[Supabase Auth] Erro no provisionamento do usuário:", authError);
  }

  // Data formatada para campo DATE do PostgreSQL (YYYY-MM-DD)
  const dbBirthDate = `${parsedBirth.year}-${String(parsedBirth.month).padStart(2, "0")}-${String(parsedBirth.day).padStart(2, "0")}`;

  // 3. Salvar mapa no Supabase
  let mapId: string | null = null;
  const { data: mapRecord, error: mapErr } = await supabase
    .from("numerology_maps")
    .insert({
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      birth_date: dbBirthDate,
      life_path: lifePath,
      expression: expression,
      soul_urge: soulUrge,
      personality: personality,
      birthday: birthday,
      maturity: maturity,
      personal_year: personalYear,
      personal_month: personalMonth,
      personal_day: personalDay,
      archetype: archetype,
      dictum: dictum,
      full_interpretation: numerologyData,
      status: "completed",
    })
    .select("id")
    .single();

  if (mapRecord) {
    mapId = mapRecord.id;
    console.log(`[Supabase] ✅ Mapa ${mapId} gravado com sucesso no banco!`);

    // Vincular ao pagamento GGPIX
    if (params.transactionId) {
      await supabase
        .from("payments")
        .update({ map_id: mapId, user_id: userId, status: "PAID", paid_at: new Date().toISOString() })
        .eq("transaction_id", String(params.transactionId));
    } else if (params.externalId) {
      await supabase
        .from("payments")
        .update({ map_id: mapId, user_id: userId, status: "PAID", paid_at: new Date().toISOString() })
        .eq("external_id", params.externalId);
    }
  } else if (mapErr) {
    console.error("[Supabase] ❌ Erro ao salvar mapa numerológico:", mapErr);
  }

  // 4. Montar PDF
  console.log(`📄 [Deliver] Renderizando PDF para ${customerName}...`);
  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(NumerologyPDFDocument as any, {
      name: customerName,
      birthDate: birthDate,
      content: numerologyData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any
  );

  // 5. Enviar e-mail via Resend
  console.log(`📧 [Deliver] Enviando e-mail para ${customerEmail}...`);
  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #222; background: #0c0c0c; color: #eee; padding: 25px; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-top: 0;">Hello, ${customerName}!</h2>
      <p>Your payment has been successfully confirmed. Your portal of cosmic wisdom is active. ✨</p>
      <p>The numbers have revealed the frequencies of your soul. Attached, you will find your complete <strong>Pythagorean Destiny Map</strong>, calculated and generated exclusively for you.</p>
      <p>Prepare a quiet environment, open the attached PDF, and discover the guidelines to align your decisions with the flow of abundance and cosmic timing.</p>
      <br/>
      <p style="color: #999;">With reverence,</p>
      <p><strong style="color: #fff;">DestinyVox Oracle</strong></p>
    </div>
  `;

  const fileNameStr = `DestinyVox_Map_${customerName.replace(/\s+/g, "_")}.pdf`;

  // 5. Enviar e-mail via Resend
  const isDev = process.env.NODE_ENV !== "production";
  // Em modo DEV local, usa delivered@resend.dev para simular sucesso sem gastar quota da conta
  const targetRecipient = isDev ? "delivered@resend.dev" : customerEmail;
  const fromEmail = isDev
    ? "DestinyVox Test <onboarding@resend.dev>"
    : (process.env.RESEND_FROM_EMAIL || "DestinyVox <contato@destinyvox.online>");

  console.log(`📧 [Deliver] Enviando e-mail para ${targetRecipient} (Modo: ${isDev ? 'DEV/TESTE - delivered@resend.dev (zero quota gasta)' : 'PRODUÇÃO'})...`);

  try {
    const resend = getResend();
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: targetRecipient,
      subject: isDev
        ? `[DEV TEST] Your Pythagorean Destiny Map ✨ — ${customerName}`
        : "Your Pythagorean Destiny Map ✨ — DestinyVox",
      html: htmlContent,
      attachments: [
        {
          filename: fileNameStr,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (emailError) {
      console.error("[Deliver] ❌ Erro retornado pela API Resend:", emailError);
    } else {
      console.log(`[Deliver] ✅ E-mail enviado com sucesso (ID: ${emailData?.id}) para ${targetRecipient}`);

      // Registrar flag de e-mail enviado no pagamento para idempotência absoluta
      if (matchedPaymentId) {
        await supabase
          .from("payments")
          .update({
            metadata: {
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_id: emailData?.id,
              delivering: false,
            },
          })
          .eq("id", matchedPaymentId);
      }
    }
  } catch (emailErr) {
    console.error("[Deliver] ❌ Erro ao enviar e-mail via Resend:", emailErr);
  }

  // 6. Enviar Alerta ao Telegram
  try {
    await sendTelegramPixNotification({
      payerName: customerName,
      payerEmail: customerEmail,
      amountCents: params.amountCents || 3990,
      transactionId: params.transactionId || "N/A",
      externalId: params.externalId || undefined,
      plan: params.plan,
    });
  } catch (tgErr) {
    console.warn("[Deliver] Aviso: Falha ao enviar alerta Telegram:", tgErr);
  }

  return {
    success: true,
    mapId,
  };
}
