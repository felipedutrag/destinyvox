import OpenAI from "openai";
import { buildPurchasedMap, readPurchase } from "@/lib/map-products";
import { generateMapLink, sendMapAccessEmail } from "@/lib/map-email";
import { sendTelegramPixNotification } from "@/lib/telegram";
import { getSupabaseAdmin } from "@/lib/supabase";
import { buildSynastry } from "@/lib/synastry";
import { validateSynastryPerson } from "@/lib/catalog";
import { brazilianDate } from "@/lib/web-map";
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
  YEARLY_FORECAST_INTERPRETATIONS,
  interpolateFirstName,
} from "@/utils/interpretations";

export interface NumerologyContent {
  numeros: {
    caminho_vida: string;
    expressao: string;
    motivacao: string;
    personalidade: string;
    ano_pessoal: string;
    gematria_detalhada: string;
    caminho_vida_desc?: string;
    expressao_desc?: string;
    motivacao_desc?: string;
    personalidade_desc?: string;
    ano_pessoal_desc?: string;
  };
  analise: {
    introducao: string;
    tikkun_missao: string;
    perfil_financeiro: string;
    sefirot_diagnostico: string;
    talento_oculto: string;
    bloqueio_ancestral: string;
    ciclo_prosperidade: string;
    profissao_ideal: string;
    sombra_dinheiro: string;
    ancora_riqueza: string;
    intuicao_investimento: string;
    codigo_abundancia: string;
    desafio_2026: string;
    conclusao: string;
    caminho_vida_analise?: string;
    expressao_analise?: string;
    motivacao_analise?: string;
    personalidade_analise?: string;
    ano_pessoal_analise?: string;
  };
}

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada");
  return new OpenAI({ apiKey: key });
};

export function normalizeNumerologyContent(data: unknown, fallbackName = ""): NumerologyContent {
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const numeros = (record.numeros && typeof record.numeros === "object" ? record.numeros : {}) as Record<string, unknown>;
  const analise = (record.analise && typeof record.analise === "object" ? record.analise : {}) as Record<string, unknown>;

  const safeStr = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(safeStr).join("\n\n");
    if (typeof v === "object") {
      try {
        return Object.entries(v as Record<string, unknown>)
          .map(([k, val]) => `${k}: ${safeStr(val)}`)
          .join(" | ");
      } catch {
        return JSON.stringify(v);
      }
    }
    return String(v);
  };

  const lpNum = parseInt(safeStr(numeros.caminho_vida).replace(/\D/g, ""), 10) || 1;
  const expNum = parseInt(safeStr(numeros.expressao).replace(/\D/g, ""), 10) || 1;
  const soulNum = parseInt(safeStr(numeros.motivacao).replace(/\D/g, ""), 10) || 1;
  const persNum = parseInt(safeStr(numeros.personalidade).replace(/\D/g, ""), 10) || 1;
  const yearNum = parseInt(safeStr(numeros.ano_pessoal).replace(/\D/g, ""), 10) || 1;

  const lpFallback = interpolateFirstName(
    (LIFE_PATH_INTERPRETATIONS.pt[lpNum] || LIFE_PATH_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
    fallbackName
  );
  const expFallback = interpolateFirstName(
    (EXPRESSION_INTERPRETATIONS.pt[expNum] || EXPRESSION_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
    fallbackName
  );
  const soulFallback = interpolateFirstName(
    (SOUL_URGE_INTERPRETATIONS.pt[soulNum] || SOUL_URGE_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
    fallbackName
  );
  const persFallback = interpolateFirstName(
    (PERSONALITY_INTERPRETATIONS.pt[persNum] || PERSONALITY_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
    fallbackName
  );
  const yearFallback = interpolateFirstName(
    (YEARLY_FORECAST_INTERPRETATIONS.pt[yearNum] || YEARLY_FORECAST_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
    fallbackName
  );

  const caminho_vida_analise =
    safeStr(analise.caminho_vida_analise).length > 30 ? safeStr(analise.caminho_vida_analise) : lpFallback;
  const expressao_analise =
    safeStr(analise.expressao_analise).length > 30 ? safeStr(analise.expressao_analise) : expFallback;
  const motivacao_analise =
    safeStr(analise.motivacao_analise).length > 30 ? safeStr(analise.motivacao_analise) : soulFallback;
  const personalidade_analise =
    safeStr(analise.personalidade_analise).length > 30 ? safeStr(analise.personalidade_analise) : persFallback;
  const ano_pessoal_analise =
    safeStr(analise.ano_pessoal_analise).length > 30 ? safeStr(analise.ano_pessoal_analise) : yearFallback;

  return {
    numeros: {
      caminho_vida: safeStr(numeros.caminho_vida) || String(lpNum),
      expressao: safeStr(numeros.expressao) || String(expNum),
      motivacao: safeStr(numeros.motivacao) || String(soulNum),
      personalidade: safeStr(numeros.personalidade) || String(persNum),
      ano_pessoal: safeStr(numeros.ano_pessoal) || String(yearNum),
      gematria_detalhada: safeStr(numeros.gematria_detalhada),
      caminho_vida_desc: caminho_vida_analise,
      expressao_desc: expressao_analise,
      motivacao_desc: motivacao_analise,
      personalidade_desc: personalidade_analise,
      ano_pessoal_desc: ano_pessoal_analise,
    },
    analise: {
      introducao: safeStr(analise.introducao),
      caminho_vida_analise,
      expressao_analise,
      motivacao_analise,
      personalidade_analise,
      ano_pessoal_analise,
      tikkun_missao: safeStr(analise.tikkun_missao),
      perfil_financeiro: safeStr(analise.perfil_financeiro),
      sefirot_diagnostico: safeStr(analise.sefirot_diagnostico),
      talento_oculto: safeStr(analise.talento_oculto),
      bloqueio_ancestral: safeStr(analise.bloqueio_ancestral),
      ciclo_prosperidade: safeStr(analise.ciclo_prosperidade),
      profissao_ideal: safeStr(analise.profissao_ideal),
      sombra_dinheiro: safeStr(analise.sombra_dinheiro),
      ancora_riqueza: safeStr(analise.ancora_riqueza),
      intuicao_investimento: safeStr(analise.intuicao_investimento),
      codigo_abundancia: safeStr(analise.codigo_abundancia),
      desafio_2026: safeStr(analise.desafio_2026),
      conclusao: safeStr(analise.conclusao),
    },
  };
}

export async function generateNumerologyContent(name: string, birthDate: string): Promise<NumerologyContent> {
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(name);
  const soulUrge = calculateSoulUrge(name);
  const personality = calculatePersonality(name);
  const personalYear = calculatePersonalYear(birthDate, 2026);

  const prompt = `
    Você é o ARCHITECTUS SUPREMO da Numerologia Pitagórica e Geometria Sagrada.
    Sua missão é gerar um RELATÓRIO TÉCNICO DE ENGENHARIA PITAGÓRICA (Mapa Pitagórico do Destino) para:
    Nome: ${name}
    Data de Nascimento: ${birthDate}

    ESTE NÃO É UM HORÓSCOPO. É UM DOSSIÊ DE DADOS VIBRACIONAIS PITAGÓRICOS.
    REGRA CRÍTICA: NÃO UTILIZE NENHUM CONCEITO OU TERMO DA CABALA (como Tikkun, Sefirot, Árvore da Vida ou Cabala). Baseie-se estritamente na tradição de Pitágoras, na Tetraktys Sagrada e nos quatro planos fundamentais (Mental, Físico, Emocional e Espiritual).

    OS CÁLCULOS MATEMÁTICOS JÁ FORAM FEITOS COM PRECISÃO ABSOLUTA. USE ESTES NÚMEROS:
    - Caminho de Vida (Destino): ${lifePath}
    - Expressão (Nome Completo): ${expression}
    - Motivação (Alma): ${soulUrge}
    - Personalidade (Imagem): ${personality}
    - Ano Pessoal (2026): ${personalYear}

    INSTRUÇÕES DE CONTEÚDO (CRÍTICAS):
    1. EXTENSÃO PROFUNDA: Cada seção da "analise" DEVE ser rica, reveladora e detalhada.
    2. NUNCA DEIXE NÚMEROS VAZIOS: Preencha "caminho_vida_analise", "expressao_analise", "motivacao_analise", "personalidade_analise" e "ano_pessoal_analise" com a interpretação profunda e completa do significado de cada número correspondente na vida de ${name}.
    3. ESTÉTICA TÉCNICA: Use termos como "Matriz Vibracional", "Geometria Sagrada Pitagórica", "Frequência de Ressonância", "Tetraktys", "Harmonia dos Planos".
    4. VETOR EVOLUTIVO: Explique o propósito evolutivo e missão de vida de ${name} através da síntese entre Alma e Expressão.
    5. TETRAKTYS: Analise a estrutura vibracional e os eixos de consciência baseados na Tetraktys pitagórica.
    6. DECOMPOSIÇÃO NOMINAL: Decomponha o nome ${name} em seus valores pitagóricos e mostre a soma absoluta em formato de texto.
    7. TOM: Sombrio, autoritário, revelador e extremamente preciso.

    Retorne EXATAMENTE no seguinte formato JSON (com todas as propriedades como strings):
    {
      "numeros": {
        "caminho_vida": "${lifePath}",
        "expressao": "${expression}",
        "motivacao": "${soulUrge}",
        "personalidade": "${personality}",
        "ano_pessoal": "${personalYear}",
        "gematria_detalhada": "Decomposição pitagórica exata de cada letra de ${name}..."
      },
      "analise": {
        "introducao": "Texto denso de abertura...",
        "caminho_vida_analise": "Interpretação profunda do Caminho de Vida ${lifePath}...",
        "expressao_analise": "Interpretação profunda da Expressão ${expression}...",
        "motivacao_analise": "Interpretação profunda da Motivação ${soulUrge}...",
        "personalidade_analise": "Interpretação profunda da Personalidade ${personality}...",
        "ano_pessoal_analise": "Interpretação profunda do Ano Pessoal ${personalYear} em 2026...",
        "tikkun_missao": "Ensaio sobre a missão de vida e vetor evolutivo da alma...",
        "perfil_financeiro": "Análise matemática do fluxo financeiro...",
        "sefirot_diagnostico": "Equilíbrio vibracional na Tetraktys Sagrada...",
        "talento_oculto": "Habilidade reprimida de gerar riqueza e dons natalícios...",
        "bloqueio_ancestral": "Padrão herdado limitante e sombra...",
        "ciclo_prosperidade": "Mapeamento dos 9 anos...",
        "profissao_ideal": "Vocações de altíssimo impacto...",
        "sombra_dinheiro": "Comportamentos sabotadores da abundância...",
        "ancora_riqueza": "Elemento prático de estabilização material...",
        "intuicao_investimento": "Critérios para tomada de risco...",
        "codigo_abundancia": "FREQ-${lifePath}77-${expression}88-${personalYear}99",
        "desafio_2026": "Ação concreta para o Ano Pessoal ${personalYear} em 2026...",
        "conclusao": "Decreto final de ativação..."
      }
    }
  `;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é o ARCHITECTUS SUPREMO da Numerologia Pitagórica e Geometria Sagrada. Responda estritamente em formato JSON válido conforme solicitado, sem qualquer menção à Cabala.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    return normalizeNumerologyContent(parsed, name);
  } catch (error) {
    console.error("Erro na chamada da OpenAI:", error);
    // Fallback estruturado caso a API falhe
    const lpFallback = interpolateFirstName(
      (LIFE_PATH_INTERPRETATIONS.pt[lifePath] || LIFE_PATH_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );
    const expFallback = interpolateFirstName(
      (EXPRESSION_INTERPRETATIONS.pt[expression] || EXPRESSION_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );
    const soulFallback = interpolateFirstName(
      (SOUL_URGE_INTERPRETATIONS.pt[soulUrge] || SOUL_URGE_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );
    const persFallback = interpolateFirstName(
      (PERSONALITY_INTERPRETATIONS.pt[personality] || PERSONALITY_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );
    const yearFallback = interpolateFirstName(
      (YEARLY_FORECAST_INTERPRETATIONS.pt[personalYear] || YEARLY_FORECAST_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

    return {
      numeros: {
        caminho_vida: String(lifePath),
        expressao: String(expression),
        motivacao: String(soulUrge),
        personalidade: String(personality),
        ano_pessoal: String(personalYear),
        gematria_detalhada: `Cálculo Pitagórico Completo para ${name}`,
        caminho_vida_desc: lpFallback,
        expressao_desc: expFallback,
        motivacao_desc: soulFallback,
        personalidade_desc: persFallback,
        ano_pessoal_desc: yearFallback,
      },
      analise: {
        introducao: `A matriz de nascimento ${birthDate} decodifica uma assinatura de geometria sagrada orientada pelo Caminho de Vida ${lifePath}. Sua estrutura reflete precisão matemática e propósito existencial pitagórico.`,
        caminho_vida_analise: lpFallback,
        expressao_analise: expFallback,
        motivacao_analise: soulFallback,
        personalidade_analise: persFallback,
        ano_pessoal_analise: yearFallback,
        tikkun_missao: `Seu vetor evolutivo demanda integração plena entre o ideal interior da alma (${soulUrge}) e a realização concreta da expressão (${expression}). O desafio é harmonizar a vontade íntima com a ação no mundo material através da disciplina pitagórica.`,
        perfil_financeiro: `O fluxo de recursos responde diretamente à disciplina e à autoridade material emanada pela vibração ${expression}.`,
        sefirot_diagnostico: `Alinhamento dos planos fundamentais da Tetraktys pitagórica (Mônada, Díade, Tríade e Tétrade) com a estabilidade e o discernimento superior.`,
        talento_oculto: `Capacidade ímpar de síntese intuitiva e liderança estratégica em momentos de inflexão.`,
        bloqueio_ancestral: `Tendência à autossabotagem em momentos de grande prosperidade. Superar pelo desapego a padrões rígidos herdados.`,
        ciclo_prosperidade: `O ciclo de 9 anos aponta o Ano Pessoal ${personalYear} como catalisador de alinhamento com seus objetivos fundamentais.`,
        profissao_ideal: `Atuações que combinem planejamento de longo prazo, estratégia e autonomia decisória.`,
        sombra_dinheiro: `A ilusão de controle excessivo sobre os resultados materiais gera estagnação do fluxo.`,
        ancora_riqueza: `Compromisso com o valor real entregue à sociedade e gestão impecável de recursos.`,
        intuicao_investimento: `Investir com base em fundamentos sólidos, evitando decisões tomadas sob urgência emocional.`,
        codigo_abundancia: `${lifePath}89-2026-${expression}`,
        desafio_2026: `Consolidar as estruturas profissionais e abrir espaço para a expansão do Ano ${personalYear}.`,
        conclusao: `O mapa numérico está traçado. A ativação dos seus números de poder depende da sua clareza de intenção e ação diária.`,
      },
    };
  }
}

export interface DeliverMapParams {
  name: string;
  email: string;
  birthDate: string;
  transactionId?: string | null;
  externalId?: string | null;
  amountCents?: number;
  plan?: string;
}

/**
 * Entrega do mapa web após confirmação do pagamento.
 * Salva nove interpretações, vincula o dono e envia acesso web via Resend.
 * Os dados da compra vêm exclusivamente do pagamento confirmado no servidor.
 */
export async function deliverNumerologyMap(params: DeliverMapParams) {
  const supabase = getSupabaseAdmin();
  if (!params.transactionId && !params.externalId) throw new Error("Pagamento não identificado");
  const query = supabase.from("payments").select("id, map_id, status, metadata, payer_name, payer_email, amount_cents, external_id, transaction_id");
  if (params.transactionId) query.eq("transaction_id", String(params.transactionId));
  else query.eq("external_id", params.externalId!);
  const { data: payment, error: paymentError } = await query.maybeSingle();
  if (paymentError || !payment || payment.status !== "PAID") throw new Error("Pagamento ainda não confirmado");
  const meta = (payment.metadata || {}) as Record<string, unknown>;
  if (meta.web_access_sent === true && payment.map_id) return { success: true, alreadyDelivered: true, mapId: payment.map_id, emailSent: true };
  if (meta.delivering === true && Date.now() - Date.parse(String(meta.delivery_started_at)) < 300_000) {
    return { success: true, delivering: true, mapId: payment.map_id, emailSent: false };
  }
  // Compare-and-set: only one webhook/client request can acquire this payment.
  let lock = supabase.from("payments").update({ metadata: { ...meta, delivering: true, delivery_started_at: new Date().toISOString() } }).eq("id", payment.id).eq("status", "PAID");
  lock = payment.metadata === null ? lock.is("metadata", null) : lock.eq("metadata", JSON.stringify(payment.metadata));
  const { data: acquired, error: lockError } = await lock.select("id").maybeSingle();
  if (lockError) throw lockError;
  if (!acquired) return { success: true, delivering: true, mapId: payment.map_id, emailSent: false };
  let sent = false;
  try {
    // Never trust the name, birth date or delivery address supplied by the browser.
    const name = String(payment.payer_name).trim();
    const email = String(payment.payer_email).trim().toLowerCase();
    const rawBirthDate = typeof meta.birthDate === "string" ? meta.birthDate : "";
    if (!name || !email || !rawBirthDate) throw new Error("Dados do pagamento incompletos");
    const parsed = parseBirthDate(rawBirthDate);
    const birthDate = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
    const content = buildPurchasedMap(name, birthDate, readPurchase(meta));
    const access = await generateMapLink(email);
    const { error: profileError } = await supabase.from("profiles").upsert({ id: access.userId, email, full_name: name }, { onConflict: "id", ignoreDuplicates: true });
    if (profileError) throw profileError;
    // A stable UUID per payment makes retries reuse the same map, even after a crash.
    const isCredit = meta.product === "synastry_credit";
    const mapId = isCredit ? String(meta.sourceMapId || "") : payment.map_id || payment.id;
    if (isCredit) {
      const { data: source, error: sourceError } = await supabase.from("numerology_maps").select("id").eq("id", mapId).eq("user_id", access.userId).eq("status", "completed").maybeSingle();
      if (sourceError || !source) throw new Error("Mapa de origem não encontrado para o crédito");
    }
    const values = Object.fromEntries(content.readings.map(r => [r.id, r.value]));
    if (!isCredit) {
      const { error: mapError } = await supabase.from("numerology_maps").upsert({
        id: mapId, user_id: access.userId, customer_name: name, customer_email: email, birth_date: birthDate,
        life_path: values.caminho, expression: values.expressao, soul_urge: values.alma,
        personality: values.personalidade, birthday: values.aniversario, maturity: values.maturidade,
        personal_year: values.ano, personal_month: values.mes, personal_day: values.dia,
        archetype: getArchetype(values.caminho, "pt"), dictum: content.dictum,
        full_interpretation: content, status: "completed",
      }, { onConflict: "id" });
      if (mapError) throw mapError;
    }
    const { error: linkError } = await supabase.from("payments").update({ map_id: mapId, user_id: access.userId }).eq("id", payment.id);
    if (linkError) throw linkError;
    // Old orders without partner data keep their unspent credit. New orders are
    // fulfilled before the access email; the existing RPC makes retries safe.
    if (!isCredit && content.purchase?.bumps.includes("synastry") && meta.synastryPerson) {
      const partner = validateSynastryPerson(meta.synastryPerson, brazilianDate());
      const { data: person, error: personError } = await supabase.from("relationship_people")
        .upsert({ user_id: access.userId, name: partner.name, birth_date: partner.birthDate }, { onConflict: "user_id,name,birth_date" })
        .select("id").single();
      if (personError || !person) throw personError || new Error("Não foi possível preparar a pessoa da sinastria");
      const report = buildSynastry({ name, birthDate }, partner, content.purchase.referenceDate);
      const { error: reportError } = await supabase.rpc("create_synastry", { p_user: access.userId, p_map: mapId, p_person: person.id, p_report: report });
      if (reportError) throw reportError;
    }
    const emailId = await sendMapAccessEmail(name, email, mapId, access.token, undefined, isCredit ? "synastry_credit" : content.purchase?.product);
    const { error: sentError } = await supabase.from("payments").update({ metadata: {
      ...meta, delivering: false, email_sent: true, web_access_sent: true,
      email_sent_at: new Date().toISOString(), email_id: emailId,
    } }).eq("id", payment.id);
    if (sentError) throw sentError;
    sent = true;
    try {
      await sendTelegramPixNotification({ payerName: name, payerEmail: email, amountCents: payment.amount_cents, transactionId: payment.transaction_id, externalId: payment.external_id, plan: String(meta.plan || "30_questions") });
    } catch (notificationError) {
      console.warn("[Deliver] Falha na notificação operacional", notificationError);
    }
    return { success: true, mapId, emailSent: true };
  } finally {
    if (!sent) await supabase.from("payments").update({ metadata: { ...meta, delivering: false } }).eq("id", payment.id);
  }
}
