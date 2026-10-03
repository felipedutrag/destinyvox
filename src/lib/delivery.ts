import { Resend } from "resend";
import OpenAI from "openai";
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

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada");
  return new OpenAI({ apiKey: key });
};

export function normalizeNumerologyContent(data: unknown): NumerologyContent {
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

  return {
    numeros: {
      caminho_vida: safeStr(numeros.caminho_vida),
      expressao: safeStr(numeros.expressao),
      motivacao: safeStr(numeros.motivacao),
      personalidade: safeStr(numeros.personalidade),
      ano_pessoal: safeStr(numeros.ano_pessoal),
      gematria_detalhada: safeStr(numeros.gematria_detalhada),
    },
    analise: {
      introducao: safeStr(analise.introducao),
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
    5. GEMATRIA DETALHADA: Decomponha o nome ${name} em seus valores numéricos e mostre a soma absoluta em formato de texto.
    6. TOM: Sombrio, autoritário, revelador e extremamente preciso.

    Retorne EXATAMENTE no seguinte formato JSON (com todas as propriedades como strings):
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
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é o ARCHITECTUS SUPREMO da Numerologia Pitagórica e Análise Numérica Hermética. Responda estritamente em formato JSON válido conforme solicitado.",
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
    return normalizeNumerologyContent(parsed);
  } catch (error) {
    console.error("Erro na chamada da OpenAI:", error);
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
 * 1. Verifica se o pagamento já possui e-mail enviado com sucesso.
 * 2. Gera os cálculos e a interpretação completa via OpenAI (gpt-4o-mini).
 * 3. Cria/recupera o usuário no Supabase Auth e salva em `numerology_maps`.
 * 4. Atualiza `payments` com status PAID e vínculo com o mapa.
 * 5. Compila o PDF estético Dark Tech.
 * 6. Envia por e-mail com Resend para o cliente real.
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

  interface PaymentRecord {
    id: string;
    map_id: string | null;
    status: string;
    metadata: Record<string, unknown> | null;
  }

  let matchedPaymentId: string | null = null;
  let existingPayment: PaymentRecord | null = null;

  if (params.transactionId || params.externalId) {
    const query = supabase.from("payments").select("id, map_id, status, metadata");
    if (params.transactionId) {
      query.eq("transaction_id", String(params.transactionId));
    } else if (params.externalId) {
      query.eq("external_id", params.externalId);
    }
    const { data } = await query.maybeSingle();
    existingPayment = data ? ((data as unknown) as PaymentRecord) : null;

    if (existingPayment) {
      matchedPaymentId = existingPayment.id;
      const meta = (existingPayment.metadata || {}) as Record<string, unknown>;

      // Apenas ignora se o e-mail JÁ FOI ENVIADO com sucesso para este pagamento
      if (meta.email_sent === true) {
        console.log(`[Deliver] 🛑 E-mail já enviado com sucesso para o pagamento ${existingPayment.id}.`);
        return {
          success: true,
          alreadyDelivered: true,
          mapId: existingPayment.map_id,
        };
      }

      // Trava de concorrência com expiração de 60s (evita webhook e front chamando ao mesmo tempo)
      if (meta.delivering === true && meta.delivery_started_at) {
        const started = new Date(meta.delivery_started_at as string).getTime();
        const diffSeconds = (Date.now() - started) / 1000;
        if (diffSeconds < 60) {
          console.log(`[Deliver] ⏳ Entrega já em andamento há ${Math.round(diffSeconds)}s para ${existingPayment.id}. Aguardando processo atual.`);
          return {
            success: true,
            delivering: true,
            mapId: existingPayment.map_id,
          };
        }
      }

      // Registra a trava imediata
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

  let numerologyData: NumerologyContent;
  let mapId: string | null = existingPayment?.map_id || null;

  // 2. Reutilizar mapa se já foi gerado para este pagamento, ou gerar um novo via OpenAI
  if (mapId) {
    console.log(`✨ [Deliver] Recuperando mapa existente ${mapId} para envio do PDF...`);
    const { data: existingMap } = await supabase
      .from("numerology_maps")
      .select("full_interpretation")
      .eq("id", mapId)
      .maybeSingle();

    if (existingMap?.full_interpretation) {
      numerologyData = normalizeNumerologyContent(existingMap.full_interpretation);
    } else {
      numerologyData = await generateNumerologyContent(customerName, birthDate);
    }
  } else {
    console.log(`✨ [Deliver] Gerando novo conteúdo do Mapa Pitagórico via OpenAI para ${customerName}...`);
    numerologyData = await generateNumerologyContent(customerName, birthDate);
  }

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

  let emailSentSuccessfully = false;

  try {
    // 3. Criar ou Vincular Usuário no Supabase Auth
    let userId: string | null = null;
    try {
      const { data: authUsers, error: listErr } = await supabase.auth.admin.listUsers();
      if (!listErr && authUsers && authUsers.users) {
        const found = authUsers.users.find((u) => u.email?.toLowerCase() === customerEmail);
        if (found) {
          userId = found.id;
          console.log(`[Supabase Auth] Usuário existente localizado: ${userId}`);
        }
      }

      if (!userId) {
        const dummyPassword = `Destiny_${Date.now()}_${Math.random().toString(36).substring(2, 8)}!`;
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: dummyPassword,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
            birth_date: birthDate,
          },
        });

        if (!createErr && newUser && newUser.user) {
          userId = newUser.user.id;
          console.log(`[Supabase Auth] Novo usuário criado automaticamente: ${userId}`);
        } else if (createErr) {
          console.warn("[Supabase Auth] Aviso ao criar usuário:", createErr.message);
        }
      }
    } catch (authError) {
      console.warn("[Supabase Auth] Falha não impeditiva no gerenciamento de Auth:", authError);
    }

    // Gravar mapa no banco de dados se ainda não tiver ID
    const dbBirthDate = `${parsedBirth.year}-${String(parsedBirth.month).padStart(2, "0")}-${String(parsedBirth.day).padStart(2, "0")}`;

    if (!mapId) {
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
    }

    // 4. Montar PDF com tratamento robusto
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

    // 5. Enviar e-mail via Resend diretamente para o cliente
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
    const fromEmail = process.env.RESEND_FROM_EMAIL || "DestinyVox <contato@destinyvox.online>";

    const resend = getResend();
    const { data: emailData, error: emailError } = await resend.emails.send({
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

    if (emailError) {
      console.error("[Deliver] ❌ Erro retornado pela API Resend:", emailError);
    } else {
      emailSentSuccessfully = true;
      console.log(`[Deliver] ✅ E-mail enviado com sucesso (ID: ${emailData?.id}) para ${customerEmail}`);

      // Registrar flag de e-mail enviado no pagamento para idempotência absoluta
      if (matchedPaymentId) {
        await supabase
          .from("payments")
          .update({
            metadata: {
              ...(existingPayment?.metadata || {}),
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_id: emailData?.id,
              delivering: false,
            },
          })
          .eq("id", matchedPaymentId);
      }
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
      emailSent: emailSentSuccessfully,
    };
  } finally {
    // Se falhou antes de enviar o e-mail, libera a trava para permitir retentativa
    if (matchedPaymentId && !emailSentSuccessfully) {
      await supabase
        .from("payments")
        .update({
          metadata: {
            ...(existingPayment?.metadata || {}),
            delivering: false,
          },
        })
        .eq("id", matchedPaymentId);
    }
  }
}
