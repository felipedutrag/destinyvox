import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
    paddingTop: 50,
    paddingBottom: 80, 
    paddingHorizontal: 50,
    backgroundColor: "#0a0a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1pt solid #DAA520",
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 9,
    color: "#DAA520",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#DAA520",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: "#e0e0e0",
    marginBottom: 10,
    textAlign: "justify",
  },
  numberLabel: {
    fontSize: 14,
    color: "#DAA520",
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  numberValue: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: "#e0e0e0",
    marginBottom: 15,
    textAlign: "justify",
  },
  highlightBox: {
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 8,
    borderLeft: "4pt solid #DAA520",
    marginVertical: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#444",
    textAlign: "center",
    borderTop: "0.5pt solid #333",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 9,
    color: "#DAA520",
  }
});

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

export const NumerologyPDFDocument = ({ name, birthDate, content }: { name: string, birthDate: string, content: NumerologyContent }) => (
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
            AVISO: ESTE DOCUMENTO CONTÉM DADOS DE GEMATRIA AVANÇADA.
            A REPRODUÇÃO NÃO AUTORIZADA PODE INTERFERIR NA FREQUÊNCIA VIBRACIONAL DO INDIVÍDUO.
          </Text>
        </View>
      </View>
    </Page>

    {/* PÁGINA 1: O MOTOR DE GEMATRIA */}
    <Page size="A4" style={styles.contentPage}>
      <View style={styles.header}>
        <Text style={styles.headerText}>LOG_01: GEMATRIA_ENGINE</Text>
        <Text style={styles.headerText}>{name}</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 0 }]}>CÁLCULOS DE FREQUÊNCIA FUNDAMENTAL</Text>
      <Text style={styles.bodyText}>{content.analise.introducao}</Text>

      <View style={{ marginVertical: 20, padding: 15, backgroundColor: "#1a1a2e", border: "1pt solid #DAA520" }}>
        <Text style={[styles.numberLabel, { marginTop: 0 }]}>MATRIZ NOMINAL (GEMATRIA):</Text>
        <Text style={[styles.bodyText, { fontSize: 11, fontStyle: "italic" }]}>{content.numeros.gematria_detalhada}</Text>
      </View>

      <Text style={styles.numberLabel}>CAMINHO DE VIDA (DESTINO):</Text>
      <Text style={styles.numberValue}>{content.numeros.caminho_vida}</Text>

      <Text style={styles.numberLabel}>EXPRESSÃO (MARCA NO MUNDO):</Text>
      <Text style={styles.numberValue}>{content.numeros.expressao}</Text>

      <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>

    {/* PÁGINA 2: TIKKUN E ALMA */}
    <Page size="A4" style={styles.contentPage}>
      <View style={styles.header}>
        <Text style={styles.headerText}>LOG_02: SOUL_MISSION</Text>
        <Text style={styles.headerText}>{name}</Text>
      </View>

      <Text style={styles.sectionTitle}>TIKKUN: A MISSÃO DE CORREÇÃO</Text>
      <Text style={styles.bodyText}>{content.analise.tikkun_missao}</Text>

      <Text style={styles.numberLabel}>MOTIVAÇÃO (DESEJO DA ALMA):</Text>
      <Text style={styles.numberValue}>{content.numeros.motivacao}</Text>

      <Text style={styles.numberLabel}>PERSONALIDADE (FILTRO EXTERNO):</Text>
      <Text style={styles.numberValue}>{content.numeros.personalidade}</Text>

      <View style={styles.highlightBox}>
        <Text style={[styles.sectionTitle, { marginTop: 0, fontSize: 14 }]}>ALINHAMENTO VOCACIONAL</Text>
        <Text style={styles.bodyText}>{content.analise.profissao_ideal}</Text>
      </View>

      <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>

    {/* PÁGINA 3: AS 10 SEFIROT */}
    <Page size="A4" style={styles.contentPage}>
      <View style={styles.header}>
        <Text style={styles.headerText}>LOG_03: SEPHIROTH_SCAN</Text>
        <Text style={styles.headerText}>{name}</Text>
      </View>

      <Text style={styles.sectionTitle}>DIAGNÓSTICO DA ÁRVORE DA VIDA</Text>
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

      <Text style={styles.sectionTitle}>DÍVIDAS KÁRMICAS E BLOQUEIOS ANCESTRAIS</Text>
      <Text style={styles.bodyText}>{content.analise.bloqueio_ancestral}</Text>

      <Text style={styles.sectionTitle}>A SOMBRA (O SABOTADOR DA RIQUEZA)</Text>
      <View style={styles.highlightBox}>
        <Text style={styles.bodyText}>{content.analise.sombra_dinheiro}</Text>
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

      <Text style={styles.sectionTitle}>CICLOS DE PROSPERIDADE (MAPEAMENTO 9 ANOS)</Text>
      <Text style={styles.bodyText}>{content.analise.ciclo_prosperidade}</Text>

      <Text style={styles.numberLabel}>ANO PESSOAL ATUAL (2026):</Text>
      <Text style={styles.numberValue}>{content.numeros.ano_pessoal}</Text>

      <Text style={styles.sectionTitle}>INTUIÇÃO E INVESTIMENTOS</Text>
      <Text style={styles.bodyText}>{content.analise.intuicao_investimento}</Text>

      <Text style={styles.sectionTitle}>ESTRATÉGIA DE EXPANSÃO 2026</Text>
      <View style={styles.highlightBox}>
        <Text style={styles.bodyText}>{content.analise.desafio_2026}</Text>
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

      <View style={{ marginTop: 20, padding: 30, border: "2pt solid #DAA520", backgroundColor: "#1a1a2e" }}>
        <Text style={[styles.sectionTitle, { marginTop: 0, fontSize: 20, textAlign: "center", color: "#ffffff" }]}>FREQUÊNCIA DE ATIVAÇÃO REAL</Text>
        <Text style={{ fontSize: 24, color: "#DAA520", textAlign: "center", marginVertical: 20, letterSpacing: 8, fontWeight: "bold" }}>{content.analise.codigo_abundancia}</Text>
        <Text style={[styles.bodyText, { textAlign: "center", fontSize: 10, opacity: 0.8 }]}>
          ESTA SEQUÊNCIA FOI GERADA ATRAVÉS DA INTERSECÇÃO DA SUA GEMATRIA COM O CAMPO MORFOGENÉTICO DA RIQUEZA.
          REPITAA DIARIAMENTE PARA REPROGRAMAR SUA REALIDADE MATERIAL.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 40 }]}>DECRETO DE MANIFESTAÇÃO</Text>
      <Text style={styles.bodyText}>{content.analise.conclusao}</Text>

      <View style={{ marginTop: 60, alignItems: "center" }}>
        <Text style={{ fontSize: 40, color: "#DAA520", opacity: 0.1, position: "absolute", top: -20 }}>777</Text>
        <Text style={[styles.bodyText, { fontStyle: "italic", textAlign: "center", color: "#DAA520" }]}>
          &quot;O UNIVERSO É UM ALGORITMO. AGORA VOCÊ POSSUI O CÓDIGO DE ACESSO.&quot;
        </Text>
      </View>

      <Text style={styles.footer} fixed>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  </Document>
);
