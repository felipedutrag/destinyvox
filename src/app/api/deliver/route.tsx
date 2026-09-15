import { NextResponse } from "next/server";
import { deliverNumerologyMap } from "@/lib/delivery";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { NumerologyPDFDocument } from "./PdfTemplate";
import { getSupabaseAdmin } from "@/lib/supabase";

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

interface NumerologyContent {
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

const fetchGroq = async (prompt: string) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurada");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq falhou (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

function cleanText(text: string): string {
  if (typeof text !== 'string') return text;
  return text.replace(/\*\*/g, ''); 
}

function cleanNumerologyData(data: unknown): NumerologyContent {
  if (typeof data === 'string') {
    return cleanText(data) as unknown as NumerologyContent;
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key in obj) {
      obj[key] = cleanNumerologyData(obj[key]);
    }
  }
  return data as NumerologyContent;
}

async function generateNumerologyContent(name: string, birthDate: string): Promise<NumerologyContent> {
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
    3. TIKKUN: Explique o conceito de Tikkun (correção da alma) de forma visceral e como ele afeta a prosperidade de ${name}.
    4. SEFIROT: Analise o equilíbrio entre as 10 Sefirot (Keter, Chokmah, Binah, Chesed, Gevurah, Tiferet, Netzach, Hod, Yesod, Malkuth) com base nos números fornecidos.
    5. GEMATRIA DETALHADA: Decomponha o nome ${name} em seus valores numéricos e mostre a soma absoluta.
    6. TOM: Sombrio, autoritário, revelador e extremamente preciso.

    ESTRUTURA DO OBJETO JSON (Retorne ESTRITAMENTE o JSON):
    {
      "numeros": {
        "caminho_vida": "${lifePath} - Explicação técnica monumental sobre o fluxo do destino.",
        "expressao": "${expression} - Análise da marca vibracional no tecido da realidade.",
        "motivacao": "${soulUrge} - O motor térmico da alma e seus desejos ocultos.",
        "personalidade": "${personality} - O firewall social e como ele filtra a abundância.",
        "ano_pessoal": "${personalYear} - Plano estratégico trimestral para 2026.",
        "gematria_detalhada": "Apresente o cálculo letra por letra de ${name} e o valor final absoluto, explicando a frequência resultante."
      },
      "analise": {
        "introducao": "Abertura sobre a geometria sagrada e o blueprint da alma de ${name}.",
        "tikkun_missao": "Mergulho exaustivo na correção espiritual (Tikkun) que ${name} veio realizar.",
        "perfil_financeiro": "Como os números de ${name} interagem com a matéria e o dinheiro.",
        "sefirot_diagnostico": "Diagnóstico técnico das 10 emanações da Árvore da Vida para ${name}.",
        "talento_oculto": "A habilidade algorítmica de gerar valor que está adormecida.",
        "bloqueio_ancestral": "Dívidas kármicas e 'bugs' hereditários no DNA espiritual.",
        "ciclo_prosperidade": "Mapeamento temporal dos grandes picos de manifestação.",
        "profissao_ideal": "Vectores de carreira de alta rentabilidade baseados na ressonância nominal.",
        "sombra_dinheiro": "O algoritmo de auto-sabotagem que drena a conta bancária.",
        "ancora_riqueza": "A base de segurança Malkuth que sustenta o império.",
        "intuicao_investimento": "Protocolos de tomada de decisão sob risco.",
        "codigo_abundancia": "Gere uma sequência numérica mística personalizada (Ex: 71427321893) e explique a ciência por trás dela.",
        "desafio_2026": "Análise estratégica de 2026: janelas de oportunidade e riscos.",
        "conclusao": "Decreto de ativação final e comando de manifestação absoluta."
      }
    }
  `;

  const GROQ_RETRIES = 5;
  const GEMINI_RETRIES = 3;

  for (let attempt = 1; attempt <= GROQ_RETRIES; attempt++) {
    try {
      console.log(`[Groq] Tentativa ${attempt} de ${GROQ_RETRIES}...`);
      const text = await fetchGroq(prompt);

      if (text) {
        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          const parsedData = JSON.parse(jsonString);
          console.log(`[Groq] Sucesso na tentativa ${attempt}!`);
          return cleanNumerologyData(parsedData);
        }
      }
      throw new Error("Resposta sem JSON válido");
    } catch (error) {
      console.error(`[Groq] Erro na tentativa ${attempt}:`, error);
      if (attempt < GROQ_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  console.warn("⚠️ Groq falhou todas as vezes. Acionando fallback: Gemini...");

  for (let attempt = 1; attempt <= GEMINI_RETRIES; attempt++) {
    try {
      console.log(`[Gemini] Tentativa de Fallback ${attempt} de ${GEMINI_RETRIES}...`);
      const ai = getGemini();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (ai as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (response as any).value?.content?.parts?.[0]?.text;

      if (text) {
        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          const parsedData = JSON.parse(jsonString);
          console.log(`[Gemini] Fallback funcionou na tentativa ${attempt}!`);
          return cleanNumerologyData(parsedData);
        }
      }
      throw new Error("Resposta do Gemini sem JSON válido");
    } catch (error) {
      console.error(`[Gemini] Erro no fallback ${attempt}:`, error);
      if (attempt < GEMINI_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  const fallbackData: NumerologyContent = {
    numeros: {
      caminho_vida: `${lifePath} - O número do poder e da execução material.`,
      expressao: `${expression} - A vibração da liderança e originalidade.`,
      motivacao: `${soulUrge} - O desejo de liberdade e novas experiências.`,
      personalidade: `${personality} - A imagem de estabilidade e confiança.`,
      ano_pessoal: `${personalYear} - Um ano de mudanças e prosperidade.`,
      gematria_detalhada: `Cálculo de ressonância nominal para ${name}: Frequência Base ${expression}.`
    },
    analise: {
      introducao: "Seu portal de abundância está se abrindo. O universo conspirou para que você recebesse estas chaves hoje.",
      tikkun_missao: "Sua missão é a retificação do fluxo material através da sabedoria consciente.",
      perfil_financeiro: "Você lida com o dinheiro de forma estratégica, mas precisa aprender a deixar o fluxo correr.",
      sefirot_diagnostico: "Suas emanações de Chesed e Gevurah estão em busca de equilíbrio dinâmico.",
      talento_oculto: "Sua capacidade de visão de longo prazo é o que vai te deixar rico.",
      bloqueio_ancestral: "Medos herdados de gerações passadas travam seu merecimento.",
      ciclo_prosperidade: "Você está entrando em um pico vibracional de colheita.",
      profissao_ideal: "Liderança de alto nível ou empreendedorismo arrojado.",
      sombra_dinheiro: "A procrastinação travestida de perfeccionismo é seu maior sabotador.",
      ancora_riqueza: "Sua capacidade de iniciar do zero e escalar novos projetos.",
      intuicao_investimento: "Siga seu instinto quando o mercado estiver em pânico.",
      codigo_abundancia: "520 741 8",
      desafio_2026: "Saber a hora exata de delegar o operacional.",
      conclusao: "A riqueza é o seu direito de nascença incontestável."
    }
  };
  return cleanNumerologyData(fallbackData);
}

export async function POST(request: Request) {
  console.log("🔔 Pedido de entrega recebido via /api/deliver");
  try {
    const body = await request.json();
    console.log("Payload de entrega:", JSON.stringify(body));

    const customerName = body.name || "Cliente";
    const customerEmail = body.email;
    const birthDateRaw = body.birthDate || "";

    if (!customerEmail) {
      return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });
    }

    const result = await deliverNumerologyMap({
      name: customerName,
      email: customerEmail,
      birthDate: birthDateRaw,
      transactionId: body.transaction_id,
      externalId: body.external_id,
      plan: body.plan,
    });

    return NextResponse.json({
      success: true,
      message: result.alreadyDelivered
        ? "Mapa já entregue anteriormente"
        : "PDF gerado, salvo no Supabase e enviado com sucesso",
      map_id: result.mapId,
      already_delivered: !!result.alreadyDelivered,
    });
  } catch (error) {
    console.error("💥 Erro Fatal na Entrega:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro interno no processamento do mapa",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
