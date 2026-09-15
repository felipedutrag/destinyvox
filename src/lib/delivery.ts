import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";
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
} from "@/utils/numerology";

export interface NumerologyContent {
  numeros: {
    caminho_vida: string;
    expressao: string;
    motivacao: string;
    personalidade: string;
    ano_pessoal: string;
    gematria_detalhada: string;
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
  };
}

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada");
  return new Resend(key);
};

const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada");
  return new GoogleGenAI({ apiKey: key });
};

export async function generateNumerologyContent(name: string, birthDate: string): Promise<NumerologyContent> {
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(name);
  const soulUrge = calculateSoulUrge(name);
  const personality = calculatePersonality(name);
  const personalYear = calculatePersonalYear(birthDate, 2026);

  const prompt = `
    Você é o ARCHITECTUS SUPREMO da Numerologia Pitagórica e Análise Numérica Hermética.
    Sua missão é gerar um RELATÓRIO TÉCNICO DE ENGENHARIA ESPIRITUAL (Mapa Pitagórico do Destino) para:
    Nome: ${name}
    Data de Nascimento: ${birthDate}

    ESTE NÃO É UM HORÓSCOPO. É UM DOSSIÊ DE DADOS VIBRACIONAIS.
    OS CÁLCULOS MATEMÁTICOS JÁ FORAM FEITOS COM PRECISÃO ABSOLUTA. USE ESTES NÚMEROS:
    - Caminho de Vida (Destino): ${lifePath}
    - Expressão (Nome Completo): ${expression}
    - Motivação (Alma): ${soulUrge}
    - Personalidade (Imagem): ${personality}
    - Ano Pessoal (2026): ${personalYear}

    INSTRUÇÕES DE CONTEÚDO (CRÍTICAS):
    1. EXTENSÃO EXTREMA: Cada seção da "analise" DEVE ser um ensaio profundo (800-1200 palavras por item).
    2. ESTÉTICA TÉCNICA: Use termos como "Matriz Vibracional", "Algoritmo Kármico", "Frequência de Ressonância", "Protocolo de Retificação".
    3. TIKKUN: Explique o conceito de Tikkun (correção da alma) e missão evolutiva e como ele afeta a prosperidade de ${name}.
    4. SEFIROT: Analise a estrutura vibracional e arquétipos baseados nos números pitagóricos fornecidos.
    5. GEMATRIA DETALHADA: Decomponha o nome ${name} em seus valores numéricos e mostre a soma absoluta.
    6. TOM: Sombrio, autoritário, revelador e extremamente preciso.

    Retorne EXATAMENTE no seguinte formato JSON (sem markdown em volta do JSON se possível, ou dentro de bloco json):
    {
      "numeros": {
        "caminho_vida": "${lifePath}",
        "expressao": "${expression}",
        "motivacao": "${soulUrge}",
        "personalidade": "${personality}",
        "ano_pessoal": "${personalYear}",
        "gematria_detalhada": "Decomposição exata de cada letra de ${name}..."
      },
      "analise": {
        "introducao": "Texto denso de abertura...",
        "tikkun_missao": "Ensaio sobre a correção e propósito...",
        "perfil_financeiro": "Análise matemática do fluxo financeiro...",
        "sefirot_diagnostico": "Equilíbrio vibracional...",
        "talento_oculto": "Habilidade reprimida de gerar riqueza...",
        "bloqueio_ancestral": "Padrão herdado limitante...",
        "ciclo_prosperidade": "Mapeamento dos 9 anos...",
        "profissao_ideal": "Vocações de altíssimo impacto...",
        "sombra_dinheiro": "Comportamentos sabotadores...",
        "ancora_riqueza": "Elemento prático de estabilização...",
        "intuicao_investimento": "Critérios para tomada de risco...",
        "codigo_abundancia": "Ex: 777-888-333 (Frequência numérica pessoal)",
        "desafio_2026": "Ação concreta para o Ano Pessoal ${personalYear}...",
        "conclusao": "Decreto final de ativação..."
      }
    }
  `;

  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return JSON.parse(text) as NumerologyContent;
  } catch (error) {
    console.error("Erro na chamada do Gemini:", error);
    // Fallback estruturado caso a API falhe
    return {
      numeros: {
        caminho_vida: String(lifePath),
        expressao: String(expression),
        motivacao: String(soulUrge),
        personalidade: String(personality),
        ano_pessoal: String(personalYear),
        gematria_detalhada: `Cálculo Pitagórico Completo para ${name}`,
      },
      analise: {
        introducao: `A matriz de nascimento ${birthDate} decodifica uma assinatura quântica orientada pelo Caminho de Vida ${lifePath}. Sua estrutura reflete precisão e propósito existencial.`,
        tikkun_missao: `Sua rota evolutiva demanda integração plena entre o ideal interior (${soulUrge}) e a realização concreta (${expression}). O desafio é transformar potenciais latentes em realizações tangíveis.`,
        perfil_financeiro: `O fluxo de recursos responde diretamente à disciplina e à autoridade material emanada pela vibração ${expression}.`,
        sefirot_diagnostico: `Pilar central alinhado com a estabilidade e o discernimento superior.`,
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

  // 1. Verificação de Idempotência: Checar se o pagamento já possui um mapa associado
  if (params.transactionId || params.externalId) {
    const query = supabase.from("payments").select("id, map_id, status");
    if (params.transactionId) {
      query.eq("transaction_id", String(params.transactionId));
    } else if (params.externalId) {
      query.eq("external_id", params.externalId);
    }
    const { data: existingPayment } = await query.maybeSingle();

    if (existingPayment?.map_id) {
      console.log(`[Deliver] Mapa ${existingPayment.map_id} já entregue anteriormente. Ignorando re-geração.`);
      return {
        success: true,
        alreadyDelivered: true,
        mapId: existingPayment.map_id,
      };
    }
  }

  // Formatar data para exibição (DD/MM/AAAA)
  let birthDate = "Data não informada";
  if (birthDateRaw) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw)) {
      const parts = birthDateRaw.split("-");
      birthDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDateRaw)) {
      birthDate = birthDateRaw;
    }
  }

  console.log(`✨ [Deliver] Gerando conteúdo do Mapa Pitagórico para ${customerName}...`);
  const numerologyData = await generateNumerologyContent(customerName, birthDate);

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
  const archetype = getArchetype(lifePath, "pt");
  const dictum = getSoulDictum(lifePath, "pt");

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

  // Data formatada para campo DATE do PostgreSQL
  let dbBirthDate = "1990-01-01";
  if (birthDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw)) {
    dbBirthDate = birthDateRaw;
  } else if (birthDate && /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    const [d, m, y] = birthDate.split("/");
    dbBirthDate = `${y}-${m}-${d}`;
  }

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
      <h2 style="color: #f59e0b; margin-top: 0;">Olá, ${customerName}!</h2>
      <p>Seu pagamento via PIX foi confirmado com sucesso. O seu portal de sabedoria cósmica está ativo. ✨</p>
      <p>Os números revelaram as frequências da sua alma. Em anexo, você encontrará o seu <strong>Mapa Pitagórico do Destino</strong> completo, calculado e gerado com exclusividade para você.</p>
      <p>Prepare um ambiente tranquilo, abra o PDF anexo e descubra as diretrizes para alinhar suas decisões ao fluxo de abundância e timing cósmico.</p>
      <br/>
      <p style="color: #999;">Com reverência,</p>
      <p><strong style="color: #fff;">Oráculo DestinyVox</strong></p>
    </div>
  `;

  const fileNameStr = `Mapa_DestinyVox_${customerName.replace(/\s+/g, "_")}.pdf`;
  const fromEmail =
    process.env.NODE_ENV === "production"
      ? "DestinyVox <contato@destinyvox.online>"
      : "DestinyVox <onboarding@resend.dev>";

  try {
    const resend = getResend();
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: "Seu Mapa Pitagórico do Destino ✨ — DestinyVox",
      html: htmlContent,
      attachments: [
        {
          filename: fileNameStr,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });
    console.log(`[Deliver] ✅ E-mail enviado com sucesso para ${customerEmail}`);
  } catch (emailErr) {
    console.error("[Deliver] ❌ Erro ao enviar e-mail via Resend:", emailErr);
  }

  // 6. Enviar Alerta ao Telegram
  try {
    await sendTelegramPixNotification({
      payerName: customerName,
      payerEmail: customerEmail,
      amountCents: params.amountCents || 1990,
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
