import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NumerologyPDFDocument } from "@/app/api/deliver/PdfTemplate";
import {
  calculateLifePath,
  calculateExpression,
  calculateSoulUrge,
  calculatePersonality,
  calculatePersonalYear,
  calculateBirthday,
  calculateMaturity,
  calculateFullNumerology,
  getArchetype,
  getSoulDictum,
} from "@/utils/numerology";
import {
  LIFE_PATH_INTERPRETATIONS,
  EXPRESSION_INTERPRETATIONS,
  SHADOW_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS,
  SOUL_URGE_INTERPRETATIONS,
  PERSONALITY_INTERPRETATIONS,
  BIRTHDAY_INTERPRETATIONS,
  MATURITY_INTERPRETATIONS,
  interpolateFirstName,
} from "@/utils/interpretations";
import { NumerologyContent } from "./delivery";

/**
 * Constrói a decomposição gemátrica pitagórica detalhada de um nome
 */
function buildDetailedGematria(name: string): string {
  const table: Record<string, number> = {
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

  const words = name.trim().split(/\s+/);
  const decomposition = words
    .map((word) => {
      const letters = word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");

      const mapped = letters.split("").map((ch) => `${ch.toUpperCase()}(${table[ch] || 0})`);
      const sum = letters.split("").reduce((acc, ch) => acc + (table[ch] || 0), 0);
      return `${word.toUpperCase()}: [ ${mapped.join(" + ")} ] = ${sum}`;
    })
    .join(" | ");

  return decomposition;
}

/**
 * Gera o conteúdo numerológico estritamente usando o acervo interno e a matemática pitagórica,
 * sem realizar nenhuma chamada externa ou para OpenAI.
 */
export function buildLocalNumerologyContent(name: string, birthDate: string): NumerologyContent {
  const profile = calculateFullNumerology(name, birthDate);
  const lang = "pt";

  const lifePathStr = String(profile.lifePath);
  const expressionStr = String(profile.expression);
  const soulUrgeStr = String(profile.soulUrge);
  const personalityStr = String(profile.personality);
  const personalYearStr = String(profile.personalYear);
  const gematriaDetalhada = buildDetailedGematria(name);

  // Dicionários em Português
  const lpDict = LIFE_PATH_INTERPRETATIONS[lang];
  const expDict = EXPRESSION_INTERPRETATIONS[lang];
  const shadowDict = SHADOW_INTERPRETATIONS[lang];
  const yearDict = YEARLY_FORECAST_INTERPRETATIONS[lang];
  const soulDict = SOUL_URGE_INTERPRETATIONS[lang];
  const persDict = PERSONALITY_INTERPRETATIONS[lang];
  const bdayDict = BIRTHDAY_INTERPRETATIONS[lang];
  const matDict = MATURITY_INTERPRETATIONS[lang];

  // Interpolações de texto
  const rawLifePath = lpDict[profile.lifePath] || lpDict[1] || "";
  const rawExpression = expDict[profile.expression] || expDict[1] || "";
  const rawShadow = shadowDict[profile.lifePath] || shadowDict[1] || "";
  const rawPersonalYear = yearDict[profile.personalYear] || yearDict[1] || "";
  const rawSoulUrge = soulDict[profile.soulUrge] || soulDict[1] || "";
  const rawPersonality = persDict[profile.personality] || persDict[1] || "";
  const rawBirthday = profile.birthday ? (bdayDict[profile.birthday] || bdayDict[1] || "") : "";
  const rawMaturity = profile.maturity ? (matDict[profile.maturity] || matDict[1] || "") : "";

  function getCoreParagraphs(text: string, count = 2): string {
    if (!text) return "";
    const parts = text.split("\n\n").map((p) => p.trim()).filter(Boolean);
    return parts.slice(0, count).join("\n\n");
  }

  const lifePathText = interpolateFirstName(rawLifePath, name);
  const expressionText = interpolateFirstName(rawExpression, name);
  const shadowText = interpolateFirstName(rawShadow, name);
  const personalYearText = interpolateFirstName(rawPersonalYear, name);
  const soulUrgeText = interpolateFirstName(rawSoulUrge, name);
  const personalityText = interpolateFirstName(rawPersonality, name);
  const birthdayText = interpolateFirstName(rawBirthday, name);
  const maturityText = interpolateFirstName(rawMaturity, name);

  const caminho_vida_analise = getCoreParagraphs(lifePathText, 2);
  const expressao_analise = getCoreParagraphs(expressionText, 2);
  const motivacao_analise = getCoreParagraphs(soulUrgeText, 2);
  const personalidade_analise = getCoreParagraphs(personalityText, 2);
  const ano_pessoal_analise = getCoreParagraphs(personalYearText, 2);

  const archetypeLp = getArchetype(profile.lifePath, lang);
  const archetypeExp = getArchetype(profile.expression, lang);
  const soulDictum = getSoulDictum(profile.lifePath, lang);

  const introducao = `Matriz vibracional estabelecida para ${name}. A geometria de nascimento decodifica uma assinatura quântica governada pelo Caminho de Vida ${profile.lifePath} (${archetypeLp.title}) e Expressão ${profile.expression} (${archetypeExp.title}). Este relatório consolida os eixos fundamentais da sua engenharia existencial segundo os cânones de Pitágoras e a Geometria Sagrada.`;

  const tikkun_missao = `Na tradição pitagórica, o Vetor Evolutivo da Alma representa a harmonização das frequências do ser. Para ${name}, o desafio cósmico reside em integrar a Vontade Interior (${profile.soulUrge}) com o Veículo de Ação no mundo (${profile.expression} • ${archetypeExp.title}). Quando os desejos profundos do espírito operam em desalinhamento com a conduta exterior, surgem atritos materiais e hesitações decisórias. Sua evolução exige transformar potenciais latentes em realizações tangíveis com integridade moral e firmeza soberana.`;

  const perfil_financeiro = `Na mecânica dos recursos materiais, seu canal de abundância opera sob a frequência da sua Expressão ${profile.expression}. ${archetypeExp.title} atua através do elemento ${archetypeExp.element}: ${archetypeExp.keyword}. Quando você estrutura projetos alinhados com sua autoridade vibracional, o fluxo de valor se estabiliza sem atrito.`;

  const sefirot_diagnostico = `Mapeamento da Tetraktys Sagrada: Os quatro planos pitagóricos (Mônada, Díade, Tríade e Tétrade) canalizam o poder do Caminho de Vida ${profile.lifePath}. Suas esferas de ação encontram ressonância com a síntese de maturidade (${profile.maturity}), projetando equilíbrio entre o intelecto analítico e a manifestação concreta.`;

  const talento_oculto = `Seu dom latente opera na intersecção da vibração do seu Dia Natalício (${profile.birthday}) com a potência criativa da sua Expressão ${profile.expression}. ${birthdayText ? getCoreParagraphs(birthdayText, 2) : "Uma habilidade nata de liderança e percepção estratégica que se manifesta espontaneamente sob pressão."}`;

  const bloqueio_ancestral = `Padrões de sabotagem e herança cármica do Caminho de Vida ${profile.lifePath}: ${getCoreParagraphs(shadowText, 2)}`;

  const ciclo_prosperidade = `A mecânica dos 9 anos obedece a um ritmo cosmológico preciso: os anos 1 a 3 representam semeadura e germinação; os anos 4 a 6 exigem estruturação, adaptação e consolidação; e os anos 7 a 9 demandam depuração espiritual, colheita de poder e fechamento de ciclos. No presente momento, você está no Ano Pessoal ${profile.personalYear}, uma fase determinante de alinhamento com a sua colheita material.`;

  const profissao_ideal = `Vocações e eixos de alta ressonância: Atuações estratégicas alinhadas com o arquétipo ${archetypeExp.title}. Domínio de processos, liderança de vanguarda e autonomia decisória baseada em ${archetypeExp.keyword}.`;

  const sombra_dinheiro = `O sabotador financeiro: O excesso de controle ou a dispersão na vibração ${profile.lifePath} pode gerar estagnação temporária. Transmuta-se compreendendo que a prosperidade é consequência da entrega de valor ético e ordem sistemática.`;

  const ancora_riqueza = `Âncora de Sustentação Material: Ancoragem na disciplina do número ${profile.expression} e na soberania espiritual: "${soulDictum}".`;

  const intuicao_investimento = `Critérios de tomada de decisão: Operar com discernimento alinhado ao Ano Pessoal ${profile.personalYear}. Acelerar nos anos de colheita e semear com prudência nos períodos de gestação e planejamento.`;

  const codigo_abundancia = `FREQ-${profile.lifePath}77-${profile.expression}88-${profile.personalYear}99`;

  const desafio_2026 = `Diretriz de Execução para 2026 (Ano Pessoal ${profile.personalYear}): Focar na consolidação da sua soberania e na remoção cirúrgica de qualquer padrão de hesitação. ${maturityText ? `Rumo à Maturidade ${profile.maturity}: ${maturityText.slice(0, 250)}...` : ""}`;

  const conclusao = `O algoritmo do seu destino está revelado. As leis matemáticas do cosmos operam com fidelidade absoluta: os números fornecem o vetor, mas a manifestação da realidade é um ato contínuo da sua vontade soberana. "${soulDictum}"`;

  return {
    numeros: {
      caminho_vida: lifePathStr,
      expressao: expressionStr,
      motivacao: soulUrgeStr,
      personalidade: personalityStr,
      ano_pessoal: personalYearStr,
      gematria_detalhada: gematriaDetalhada,
      caminho_vida_desc: caminho_vida_analise,
      expressao_desc: expressao_analise,
      motivacao_desc: motivacao_analise,
      personalidade_desc: personalidade_analise,
      ano_pessoal_desc: ano_pessoal_analise,
    },
    analise: {
      introducao,
      caminho_vida_analise,
      expressao_analise,
      motivacao_analise,
      personalidade_analise,
      ano_pessoal_analise,
      tikkun_missao,
      perfil_financeiro,
      sefirot_diagnostico,
      talento_oculto,
      bloqueio_ancestral,
      ciclo_prosperidade,
      profissao_ideal,
      sombra_dinheiro,
      ancora_riqueza,
      intuicao_investimento,
      codigo_abundancia,
      desafio_2026,
      conclusao,
    },
  };
}

/**
 * Gera o Buffer do PDF diretamente via @react-pdf/renderer
 */
export async function generateLocalNumerologyPDF(name: string, birthDate: string): Promise<{ pdfBuffer: Buffer; content: NumerologyContent }> {
  const content = buildLocalNumerologyContent(name, birthDate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(NumerologyPDFDocument as any, {
    name,
    birthDate,
    content,
  }) as any;

  const pdfBuffer = await renderToBuffer(doc);
  return { pdfBuffer, content };
}
