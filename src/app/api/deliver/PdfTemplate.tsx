import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { getArchetype } from "@/utils/numerology";
import {
  LIFE_PATH_INTERPRETATIONS,
  EXPRESSION_INTERPRETATIONS,
  SOUL_URGE_INTERPRETATIONS,
  PERSONALITY_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS,
  interpolateFirstName,
} from "@/utils/interpretations";

// Desativar hifenização automática em inglês que quebra no runtime Node.js
Font.registerHyphenationCallback((word) => [word]);

function safeVal(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeVal).join(", ");
  if (typeof val === "object") {
    try {
      return Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
    } catch {
      return JSON.stringify(val);
    }
  }
  return String(val);
}

function parseNum(val: unknown, fallback = 1): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/\D/g, "");
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#0a0a1a",
    fontFamily: "Helvetica",
    color: "#ffffff",
  },
  coverPage: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a1a",
    border: "20pt solid #1a1a2e",
  },
  goldBorder: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: "2pt solid #DAA520",
  },
  title: {
    fontSize: 24,
    color: "#DAA520",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 2,
    opacity: 0.8,
  },
  consultantName: {
    fontSize: 24,
    color: "#ffffff",
    marginTop: 100,
    marginBottom: 5,
    fontWeight: "bold",
  },
  birthDate: {
    fontSize: 12,
    color: "#DAA520",
    marginBottom: 20,
  },
  contentPage: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: "#0a0a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1pt solid #DAA520",
    paddingBottom: 8,
    marginBottom: 14,
  },
  headerText: {
    fontSize: 8.5,
    color: "#DAA520",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#DAA520",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: "#d0d0e0",
    marginBottom: 8,
    textAlign: "justify",
  },
  numberCard: {
    backgroundColor: "#111129",
    border: "1pt solid #25254a",
    borderLeft: "3pt solid #DAA520",
    borderRadius: 4,
    padding: 10,
    marginVertical: 6,
  },
  numberCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  numberBadge: {
    backgroundColor: "#1a1a38",
    border: "1.5pt solid #DAA520",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  numberBadgeDigit: {
    fontSize: 12,
    color: "#DAA520",
    fontWeight: "bold",
  },
  numberTitleCol: {
    flex: 1,
  },
  numberCategoryText: {
    fontSize: 9.5,
    color: "#DAA520",
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  numberArchetypeText: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "bold",
    marginTop: 1,
    opacity: 0.9,
  },
  numberDescription: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#d0d0e0",
    textAlign: "justify",
  },
  highlightBox: {
    backgroundColor: "#14142e",
    padding: 10,
    borderRadius: 4,
    borderLeft: "3pt solid #DAA520",
    marginVertical: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: "#555",
    textAlign: "center",
    borderTop: "0.5pt solid #222",
    paddingTop: 8,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 8,
    color: "#DAA520",
  },
});

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

const NumberCard = ({
  number,
  category,
  archetype,
  text,
}: {
  number: number | string;
  category: string;
  archetype?: { title: string; keyword?: string; element?: string };
  text: string;
}) => (
  <View style={styles.numberCard}>
    <View style={styles.numberCardHeader}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberBadgeDigit}>{number}</Text>
      </View>
      <View style={styles.numberTitleCol}>
        <Text style={styles.numberCategoryText}>{category}</Text>
        {archetype && (
          <Text style={styles.numberArchetypeText}>
            {archetype.title}{archetype.keyword ? ` • ${archetype.keyword}` : ""}
          </Text>
        )}
      </View>
    </View>
    <Text style={styles.numberDescription}>{text}</Text>
  </View>
);

export const NumerologyPDFDocument = ({
  name,
  birthDate,
  content,
}: {
  name: string;
  birthDate: string;
  content: NumerologyContent;
}) => {
  const lpNum = parseNum(content?.numeros?.caminho_vida, 1);
  const expNum = parseNum(content?.numeros?.expressao, 1);
  const soulNum = parseNum(content?.numeros?.motivacao, 1);
  const persNum = parseNum(content?.numeros?.personalidade, 1);
  const yearNum = parseNum(content?.numeros?.ano_pessoal, 1);

  const archetypeLp = getArchetype(lpNum, "pt");
  const archetypeExp = getArchetype(expNum, "pt");
  const archetypeSoul = getArchetype(soulNum, "pt");
  const archetypePers = getArchetype(persNum, "pt");
  const archetypeYear = getArchetype(yearNum, "pt");

  // Fallbacks ricos e automáticos caso não venham em analise ou numeros
  const lpText =
    content?.analise?.caminho_vida_analise ||
    content?.numeros?.caminho_vida_desc ||
    interpolateFirstName(
      (LIFE_PATH_INTERPRETATIONS.pt[lpNum] || LIFE_PATH_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

  const expText =
    content?.analise?.expressao_analise ||
    content?.numeros?.expressao_desc ||
    interpolateFirstName(
      (EXPRESSION_INTERPRETATIONS.pt[expNum] || EXPRESSION_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

  const soulText =
    content?.analise?.motivacao_analise ||
    content?.numeros?.motivacao_desc ||
    interpolateFirstName(
      (SOUL_URGE_INTERPRETATIONS.pt[soulNum] || SOUL_URGE_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

  const persText =
    content?.analise?.personalidade_analise ||
    content?.numeros?.personalidade_desc ||
    interpolateFirstName(
      (PERSONALITY_INTERPRETATIONS.pt[persNum] || PERSONALITY_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

  const yearText =
    content?.analise?.ano_pessoal_analise ||
    content?.numeros?.ano_pessoal_desc ||
    interpolateFirstName(
      (YEARLY_FORECAST_INTERPRETATIONS.pt[yearNum] || YEARLY_FORECAST_INTERPRETATIONS.pt[1] || "").split("\n\n").slice(0, 2).join("\n\n"),
      name
    );

  return (
    <Document title={`Mapa Pitagórico do Destino - ${name}`}>
      {/* CAPA - ESTÉTICA DARK TECH */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={styles.goldBorder} />
          <Text style={[styles.title, { fontSize: 32, marginBottom: 5 }]}>DESTINYVOX // ENGINE</Text>
          <Text style={[styles.title, { color: "#ffffff", fontSize: 24 }]}>MAPA PITAGÓRICO DO DESTINO</Text>
          <Text style={styles.subtitle}>PROTOCOLO DE ENGENHARIA ESPIRITUAL V.4.2</Text>

          <View style={{ marginTop: 80, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: "#DAA520", letterSpacing: 5 }}>CONSULTANTE ANALISADO:</Text>
            <Text style={styles.consultantName}>{name.toUpperCase()}</Text>
            <Text style={styles.birthDate}>MATRIZ DE NASCIMENTO: {birthDate}</Text>
          </View>

          <View style={{ marginTop: 100, borderTop: "1pt solid #333", paddingTop: 20, width: "60%" }}>
            <Text style={{ fontSize: 8, color: "#888", textAlign: "center", letterSpacing: 2, lineHeight: 1.5 }}>
              AVISO: ESTE DOCUMENTO CONTÉM DADOS DE NUMEROLOGIA PITAGÓRICA AVANÇADA.
              A REPRODUÇÃO NÃO AUTORIZADA PODE INTERFERIR NA FREQUÊNCIA VIBRACIONAL DO INDIVÍDUO.
            </Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 1: O MOTOR PITAGÓRICO */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_01: PYTHAGORAS_ENGINE</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>CÁLCULOS DE FREQUÊNCIA FUNDAMENTAL</Text>
        <Text style={styles.bodyText}>{content.analise.introducao}</Text>

        <View style={{ marginVertical: 8, padding: 10, backgroundColor: "#14142b", border: "1pt solid #DAA520", borderRadius: 4 }}>
          <Text style={[styles.numberCategoryText, { color: "#DAA520", marginBottom: 4 }]}>DECOMPOSIÇÃO NOMINAL PITAGÓRICA:</Text>
          <Text style={[styles.bodyText, { fontSize: 9, fontStyle: "italic", marginBottom: 0 }]}>{safeVal(content?.numeros?.gematria_detalhada)}</Text>
        </View>

        <NumberCard
          number={lpNum}
          category="CAMINHO DE VIDA (DESTINO)"
          archetype={archetypeLp}
          text={lpText}
        />

        <NumberCard
          number={expNum}
          category="EXPRESSÃO (MARCA NO MUNDO)"
          archetype={archetypeExp}
          text={expText}
        />

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PÁGINA 2: VETOR EVOLUTIVO E ALMA */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_02: SOUL_PURPOSE</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>VETOR EVOLUTIVO: A MISSÃO DA ALMA</Text>
        <Text style={styles.bodyText}>{content.analise.tikkun_missao}</Text>

        <NumberCard
          number={soulNum}
          category="MOTIVAÇÃO (DESEJO DA ALMA)"
          archetype={{ title: archetypeSoul.title, keyword: "Vontade Íntima e Propósito da Alma", element: archetypeSoul.element }}
          text={soulText}
        />

        <NumberCard
          number={persNum}
          category="PERSONALIDADE (FILTRO EXTERNO)"
          archetype={{ title: archetypePers.title, keyword: "Campo Áurico e Percepção Social", element: archetypePers.element }}
          text={persText}
        />

        <View style={styles.highlightBox}>
          <Text style={[styles.sectionTitle, { marginTop: 0, fontSize: 11, marginBottom: 4 }]}>ALINHAMENTO VOCACIONAL</Text>
          <Text style={[styles.bodyText, { marginBottom: 0 }]}>{content.analise.profissao_ideal}</Text>
        </View>

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PÁGINA 3: A TETRAKTYS PITAGÓRICA */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_03: TETRAKTYS_SCAN</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>DIAGNÓSTICO DA TETRAKTYS SAGRADA</Text>
        <Text style={styles.bodyText}>{content.analise.sefirot_diagnostico}</Text>

        <Text style={styles.sectionTitle}>PERFIL FINANCEIRO VIBRACIONAL</Text>
        <Text style={styles.bodyText}>{content.analise.perfil_financeiro}</Text>

        <Text style={styles.sectionTitle}>ÂNCORA DE ESTABILIDADE</Text>
        <Text style={styles.bodyText}>{content.analise.ancora_riqueza}</Text>

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PÁGINA 4: KARMA E SOMBRAS */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_04: KARMIC_ANALYSIS</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>DÍVIDAS KÁRMICAS E BLOQUEIOS ANCESTRAIS</Text>
        <Text style={styles.bodyText}>{content.analise.bloqueio_ancestral}</Text>

        <Text style={styles.sectionTitle}>A SOMBRA (O SABOTADOR DA RIQUEZA)</Text>
        <View style={styles.highlightBox}>
          <Text style={[styles.bodyText, { marginBottom: 0 }]}>{content.analise.sombra_dinheiro}</Text>
        </View>

        <Text style={styles.sectionTitle}>TALENTO OCULTO (GERAÇÃO DE VALOR)</Text>
        <Text style={styles.bodyText}>{content.analise.talento_oculto}</Text>

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PÁGINA 5: CICLOS E ESTRATÉGIA */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_05: DESTINY_CYCLES</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>CICLOS DE PROSPERIDADE (MAPEAMENTO 9 ANOS)</Text>
        <Text style={styles.bodyText}>{content.analise.ciclo_prosperidade}</Text>

        <NumberCard
          number={yearNum}
          category="ANO PESSOAL ATUAL (2026)"
          archetype={{ title: archetypeYear.title, keyword: `Clima Energético: ${archetypeYear.keyword}`, element: archetypeYear.element }}
          text={yearText}
        />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>INTUIÇÃO E INVESTIMENTOS</Text>
        <Text style={styles.bodyText}>{content.analise.intuicao_investimento}</Text>

        <View style={styles.highlightBox}>
          <Text style={[styles.sectionTitle, { marginTop: 0, fontSize: 11, marginBottom: 4 }]}>ESTRATÉGIA DE EXPANSÃO 2026</Text>
          <Text style={[styles.bodyText, { marginBottom: 0 }]}>{content.analise.desafio_2026}</Text>
        </View>

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PÁGINA 6: ATIVAÇÃO FINAL */}
      <Page size="A4" style={styles.contentPage}>
        <View style={styles.header}>
          <Text style={styles.headerText}>LOG_06: ACTIVATION_CORE</Text>
          <Text style={styles.headerText}>{name}</Text>
        </View>

        <View style={{ marginTop: 10, padding: 20, border: "2pt solid #DAA520", backgroundColor: "#14142b", borderRadius: 6 }}>
          <Text style={[styles.sectionTitle, { marginTop: 0, fontSize: 16, textAlign: "center", color: "#ffffff" }]}>FREQUÊNCIA DE ATIVAÇÃO REAL</Text>
          <Text style={{ fontSize: 20, color: "#DAA520", textAlign: "center", marginVertical: 14, letterSpacing: 6, fontWeight: "bold" }}>{content.analise.codigo_abundancia}</Text>
          <Text style={[styles.bodyText, { textAlign: "center", fontSize: 8.5, opacity: 0.85, marginBottom: 0 }]}>
            ESTA SEQUÊNCIA FOI GERADA ATRAVÉS DA INTERSECÇÃO DA SUA ASSINATURA PITAGÓRICA COM A GEOMETRIA SAGRADA DA PROSPERIDADE.
            REPITA-A DIARIAMENTE PARA REPROGRAMAR SUA REALIDADE MATERIAL.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>DECRETO DE MANIFESTAÇÃO</Text>
        <Text style={styles.bodyText}>{content.analise.conclusao}</Text>

        <View style={{ marginTop: 40, alignItems: "center" }}>
          <Text style={{ fontSize: 36, color: "#DAA520", opacity: 0.12, position: "absolute", top: -16 }}>777</Text>
          <Text style={[styles.bodyText, { fontStyle: "italic", textAlign: "center", color: "#DAA520", fontSize: 10 }]}>
            &quot;O UNIVERSO É UM ALGORITMO. AGORA VOCÊ POSSUI O CÓDIGO DE ACESSO.&quot;
          </Text>
        </View>

        <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>
    </Document>
  );
};

