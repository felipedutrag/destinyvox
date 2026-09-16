import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { NumerologyContent } from "@/lib/delivery";

// Desativar hifenização automática que quebra no runtime Node.js
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 38,
    paddingHorizontal: 42, // Margem lateral ampliada
    backgroundColor: "#070714",
    fontFamily: "Helvetica",
    color: "#ffffff",
  },
  coverPage: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070714",
    border: "16pt solid #101024",
    padding: 24,
  },
  goldBorder: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    border: "1.5pt solid #DAA520",
  },
  coverBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 3,
    border: "1pt solid #DAA520",
    backgroundColor: "#121226",
    marginBottom: 16,
  },
  coverBadgeText: {
    fontSize: 8.5,
    color: "#DAA520",
    fontWeight: "bold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    color: "#DAA520",
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 10.5,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 2,
    opacity: 0.85,
  },
  consultantCard: {
    marginTop: 14,
    marginBottom: 16,
    alignItems: "center",
    padding: 14,
    backgroundColor: "#111124",
    border: "1pt solid #2d2d4a",
    borderRadius: 6,
    width: "86%",
  },
  consultantName: {
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 4,
    fontWeight: "bold",
    textAlign: "center",
  },
  birthDate: {
    fontSize: 10,
    color: "#DAA520",
    letterSpacing: 1.5,
  },
  coreSummaryRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 16,
    width: "94%",
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "#121226",
    border: "1pt solid #2d2d4a",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  summaryPillLabel: {
    fontSize: 6.5,
    color: "#8e8ea8",
    textTransform: "uppercase",
    marginBottom: 2,
    textAlign: "center",
  },
  summaryPillNum: {
    fontSize: 14,
    color: "#DAA520",
    fontWeight: "bold",
  },
  summaryPillTitle: {
    fontSize: 6.2,
    color: "#d8d8e8",
    textAlign: "center",
    marginTop: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1pt solid #252542",
    paddingBottom: 6,
    marginBottom: 10,
  },
  headerTag: {
    fontSize: 8,
    color: "#DAA520",
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerName: {
    fontSize: 8,
    color: "#8e8ea8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 12.5,
    color: "#DAA520",
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  heroCard: {
    backgroundColor: "#111124",
    border: "1pt solid #DAA520",
    borderRadius: 6,
    padding: 9,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  heroBadge: {
    width: 42,
    height: 42,
    borderRadius: 5,
    backgroundColor: "#1a1a36",
    border: "1.5pt solid #DAA520",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  heroBadgeText: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#DAA520",
  },
  heroTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    fontSize: 8.5,
    color: "#DAA520",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dictumBox: {
    backgroundColor: "#121226",
    borderLeft: "2.5pt solid #DAA520",
    padding: 7,
    marginBottom: 8,
  },
  dictumText: {
    fontSize: 8.8,
    fontStyle: "italic",
    color: "#f3e7c4",
    lineHeight: 1.38,
  },
  paragraph: {
    fontSize: 9.6, // Fonte ampliada conforme pedido (era 8.8)
    lineHeight: 1.45,
    color: "#dcdce8",
    marginBottom: 6.5,
    textAlign: "justify",
  },
  highlightBox: {
    backgroundColor: "#121226",
    border: "1pt solid #2d2d4a",
    borderRadius: 4,
    padding: 8,
    marginTop: 5,
  },
  highlightTitle: {
    fontSize: 8.6,
    fontWeight: "bold",
    color: "#DAA520",
    letterSpacing: 1,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  highlightText: {
    fontSize: 8.4,
    color: "#b0b0c6",
    lineHeight: 1.38,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 42,
    right: 42,
    borderTop: "0.5pt solid #222238",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#606078",
    letterSpacing: 1,
  },
  pageNumber: {
    fontSize: 7.5,
    color: "#DAA520",
    fontWeight: "bold",
  },
});

export const NumerologyPDFDocument = ({ name, birthDate, content }: { name: string, birthDate: string, content: NumerologyContent }) => {
  const { profile, gematria, pillars, shadow, activation, orderBumps } = content;

  return (
    <Document title={`Mapa Pitagórico do Destino - ${name}`}>
      {/* ============================================================ */}
      {/* PÁGINA 1: CAPA - ESTÉTICA DARK TECH LUXO                    */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={styles.goldBorder} />
          
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>DESTINYVOX // ENGINE V.4.2</Text>
          </View>

          <Text style={styles.title}>MAPA PITAGÓRICO DO DESTINO</Text>
          <Text style={styles.subtitle}>DOSSIÊ VIBRACIONAL DE ENGENHARIA DA CONSCIÊNCIA</Text>

          <View style={styles.consultantCard}>
            <Text style={{ fontSize: 8, color: "#DAA520", letterSpacing: 3, marginBottom: 4, textTransform: "uppercase" }}>
              CONSULTANTE TITULAR
            </Text>
            <Text style={styles.consultantName}>{profile.fullName}</Text>
            <Text style={styles.birthDate}>COORDENADA NATAL: {profile.birthDate}</Text>
          </View>

          {/* 5 Pilares no Grid de Capa */}
          <View style={styles.coreSummaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Caminho Vida</Text>
              <Text style={styles.summaryPillNum}>{pillars.lifePath.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.lifePath.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Expressão</Text>
              <Text style={styles.summaryPillNum}>{pillars.expression.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.expression.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Desejo Alma</Text>
              <Text style={styles.summaryPillNum}>{pillars.soulUrge.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.soulUrge.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Personalidade</Text>
              <Text style={styles.summaryPillNum}>{pillars.personality.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.personality.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Ano 2026</Text>
              <Text style={styles.summaryPillNum}>{pillars.personalYear.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.personalYear.archetype}</Text>
            </View>
          </View>

          {/* Badges de Upgrades/Order Bumps Adquiridos na Capa */}
          {((orderBumps?.karmicDebt?.active) || (orderBumps?.personalYearMonths?.active)) && (
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10, marginBottom: 2 }}>
              {orderBumps?.karmicDebt?.active && (
                <View style={{ backgroundColor: "#15152d", border: "1pt solid #DAA520", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                  <Text style={{ fontSize: 6.8, color: "#DAA520", fontWeight: "bold", letterSpacing: 0.8 }}>
                    ★ DOSSIÊ DÍVIDAS KÁRMICAS INCLUSO
                  </Text>
                </View>
              )}
              {orderBumps?.personalYearMonths?.active && (
                <View style={{ backgroundColor: "#15152d", border: "1pt solid #DAA520", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                  <Text style={{ fontSize: 6.8, color: "#DAA520", fontWeight: "bold", letterSpacing: 0.8 }}>
                    ★ GUIA 2026 MÊS A MÊS INCLUSO
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: "#8e8ea8", letterSpacing: 1.5, marginBottom: 3 }}>
              CÁLCULOS RIGOROSAMENTE COMPUTADOS SEGUNDO A TRADIÇÃO HERMÉTICA
            </Text>
            <Text style={{ fontSize: 7, color: "#606078", letterSpacing: 1 }}>
              EDIÇÃO EXCLUSIVA E INTRANSFERÍVEL • PROTOCOLO CRIPTOGRÁFICO DESTINYVOX
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 2: MATRIZ VIBRACIONAL & GEMATRIA COM SOMAS DIDÁTICAS   */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_01: MATRIZ_VIBRACIONAL // GEMATRIA_NOMINAL</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <Text style={styles.sectionTitle}>A Ciência da Vibração & Gematria Nominal</Text>
        <Text style={styles.paragraph}>
          Na cosmologia pitagórica, cada letra e fonema emite uma frequência matemática invariável. O nome de certidão de nascimento não é um acaso linguístico; é o código sonoro que magnetizou a consciência para a manifestação no plano físico. Abaixo está a decomposição matemática com a demonstração exata das somas.
        </Text>

        {/* Decomposição Nominal Didática com '+' */}
        <View style={[styles.highlightBox, { marginVertical: 6, padding: 8 }]}>
          <Text style={styles.highlightTitle}>Decomposição Fonética por Palavra (Valores com '+'):</Text>
          <View style={{ flexDirection: "column", gap: 5, marginVertical: 4 }}>
            {gematria.words.map((w, wIdx) => (
              <View key={wIdx} style={{ backgroundColor: "#1a1a36", padding: 5, borderRadius: 4, border: "0.5pt solid #353555" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#ffffff" }}>{w.word}</Text>
                  <Text style={{ fontSize: 7.5, color: "#DAA520", fontWeight: "bold" }}>Total: {w.sum} ➔ Redução: {w.reductionString}</Text>
                </View>
                <Text style={{ fontSize: 7.5, color: "#c8c8dc" }}>
                  {w.additionString}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 7.5, color: "#DAA520", marginTop: 3 }}>
            Soma Bruta Nominal Total: {gematria.totalSum} pontos ➔ Redução Teosófica: {gematria.expressionNumber}
          </Text>
        </View>

        {/* Cálculo da Data com '+' */}
        {gematria.dateCalculationString ? (
          <View style={[styles.highlightBox, { marginVertical: 5, padding: 8, borderColor: "#DAA520" }]}>
            <Text style={styles.highlightTitle}>Cálculo Matemático da Data de Nascimento (Caminho de Vida):</Text>
            <Text style={{ fontSize: 8, color: "#ffffff", marginTop: 2 }}>
              Data: {profile.birthDate} ➔ {gematria.dateCalculationString} = {pillars.lifePath.number}
            </Text>
          </View>
        ) : null}

        {/* 3 Forças Nominais com '+' */}
        <View style={{ flexDirection: "row", gap: 6, marginVertical: 6 }}>
          <View style={[styles.summaryPill, { flex: 1, padding: 7 }]}>
            <Text style={styles.summaryPillLabel}>Vogais (Desejo da Alma)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15 }]}>{gematria.soulUrgeNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#8e8ea8", marginTop: 1 }}>Soma: {gematria.vowelsSum}</Text>
            <Text style={{ fontSize: 7, color: "#d8d8e8", textAlign: "center", marginTop: 2 }}>O clamor secreto da sua essência</Text>
          </View>
          <View style={[styles.summaryPill, { flex: 1, padding: 7 }]}>
            <Text style={styles.summaryPillLabel}>Consoantes (Personalidade)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15 }]}>{gematria.personalityNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#8e8ea8", marginTop: 1 }}>Soma: {gematria.consonantsSum}</Text>
            <Text style={{ fontSize: 7, color: "#d8d8e8", textAlign: "center", marginTop: 2 }}>A vestimenta social e presença</Text>
          </View>
          <View style={[styles.summaryPill, { flex: 1, padding: 7, borderColor: "#DAA520" }]}>
            <Text style={[styles.summaryPillLabel, { color: "#DAA520" }]}>Total (Expressão)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15, color: "#DAA520" }]}>{gematria.expressionNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#8e8ea8", marginTop: 1 }}>Soma: {gematria.totalSum}</Text>
            <Text style={{ fontSize: 7, color: "#d8d8e8", textAlign: "center", marginTop: 2 }}>Sua marca realizadora no mundo</Text>
          </View>
        </View>

        <View style={[styles.highlightBox, { marginTop: 6 }]}>
          <Text style={styles.highlightTitle}>Os 7 Pilares Pitagóricos Calculados:</Text>
          <Text style={styles.highlightText}>
            • Caminho de Vida: {pillars.lifePath.number} ({pillars.lifePath.archetype}) — O rumo central do destino.{'\n'}
            • Expressão: {pillars.expression.number} ({pillars.expression.archetype}) — Suas ferramentas práticas de geração de valor.{'\n'}
            • Desejo da Alma: {pillars.soulUrge.number} ({pillars.soulUrge.archetype}) — O combustível afetivo e anímico.{'\n'}
            • Personalidade: {pillars.personality.number} ({pillars.personality.archetype}) — A interface relacional com o mundo.{'\n'}
            • Ano Pessoal 2026: {pillars.personalYear.number} ({pillars.personalYear.archetype}) — O clima temporal deste ciclo anual.{'\n'}
            • Dom Congênito: {pillars.birthday.number} ({pillars.birthday.archetype}) — O talento inato trazido no nascimento.{'\n'}
            • Maturidade: {pillars.maturity.number} ({pillars.maturity.archetype}) — A consagração dos 35-40 anos em diante.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 3: CAMINHO DE VIDA (DESTINO CENTRAL)                  */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_02: CAMINHO_DE_VIDA // PILAR_01</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.lifePath.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.lifePath.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.lifePath.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.lifePath.element.toUpperCase()} • DIRETRIZ: {pillars.lifePath.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.lifePath.dictum ? (
          <View style={styles.dictumBox}>
            <Text style={styles.dictumText}>"{pillars.lifePath.dictum}"</Text>
          </View>
        ) : null}

        {pillars.lifePath.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Realização do Destino:</Text>
          <Text style={styles.highlightText}>
            Para manifestar a plenitude do Caminho de Vida {pillars.lifePath.number}, alinhe suas decisões diárias com a frequência do {pillars.lifePath.archetype}. Recuse a autossabotagem e assuma a liderança consciente da sua rota.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 4: POTENCIAL DE EXPRESSÃO (VOCAÇÃO E TALENTO)         */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_03: EXPRESSAO // PILAR_02</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.expression.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.expression.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.expression.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.expression.element.toUpperCase()} • VETOR: {pillars.expression.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.expression.dictum ? (
          <View style={styles.dictumBox}>
            <Text style={styles.dictumText}>"{pillars.expression.dictum}"</Text>
          </View>
        ) : null}

        {pillars.expression.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Alinhamento Vocacional & Geração de Riqueza:</Text>
          <Text style={styles.highlightText}>
            A vibração {pillars.expression.number} é o canal pelo qual suas ideias se convertem em valor tangível. Atuar em harmonia com o arquétipo do {pillars.expression.archetype} dissipa atritos profissionais e atrai abundância material legítima.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 5: DESEJO DA ALMA (MOTIVAÇÃO INTERIOR / ANIMA)        */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_04: DESEJO_DA_ALMA // PILAR_03</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.soulUrge.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.soulUrge.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.soulUrge.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.soulUrge.element.toUpperCase()} • ÂMAGO: {pillars.soulUrge.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.soulUrge.dictum ? (
          <View style={styles.dictumBox}>
            <Text style={styles.dictumText}>"{pillars.soulUrge.dictum}"</Text>
          </View>
        ) : null}

        {pillars.soulUrge.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Santuário Íntimo & Combustível Afetivo:</Text>
          <Text style={styles.highlightText}>
            O Desejo da Alma {pillars.soulUrge.number} ({pillars.soulUrge.archetype}) representa suas necessidades mais invioláveis. Honrar essa chama secreta impede o esgotamento espiritual e sustenta a integridade da sua jornada afetiva.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 6: PERSONALIDADE (A MÁSCARA SOCIAL E PRESENÇA)        */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_05: PERSONALIDADE // PILAR_04</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.personality.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.personality.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.personality.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.personality.element.toUpperCase()} • PRESENÇA: {pillars.personality.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.personality.dictum ? (
          <View style={styles.dictumBox}>
            <Text style={styles.dictumText}>"{pillars.personality.dictum}"</Text>
          </View>
        ) : null}

        {pillars.personality.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Maestria da Presença & Interface Social:</Text>
          <Text style={styles.highlightText}>
            A Personalidade {pillars.personality.number} é o escudo e o cartão de visitas magnético do seu ser. Quando calibrada com sabedoria, ela inspira respeito imediato, abre portas estratégicas e protege sua intimidade contra invasões desnecessárias.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 7: ALQUIMIA KÁRMICA & DESAFIO DA SOMBRA               */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_06: ALQUIMIA_KARMICA // DESAFIO_DA_SOMBRA</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={[styles.heroCard, { borderColor: "#c28820" }]}>
          <View style={[styles.heroBadge, { borderColor: "#c28820" }]}>
            <Text style={[styles.heroBadgeText, { color: "#c28820" }]}>Δ</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{shadow.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#c28820", marginTop: 1 }}>
              {shadow.title}
            </Text>
            <Text style={[styles.heroSubtitle, { color: "#c28820" }]}>
              FREQUÊNCIA INVERTIDA • PONTO DE ATRITO KÁRMICO
            </Text>
          </View>
        </View>

        <View style={[styles.dictumBox, { borderLeftColor: "#c28820" }]}>
          <Text style={styles.dictumText}>
            "Aquilo que você não traz à luz da consciência se manifesta em sua vida como destino. O ouro espiritual está oculto sob a matéria mais densa da sua sombra."
          </Text>
        </View>

        {shadow.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={[styles.highlightBox, { borderColor: "#c28820", backgroundColor: "#15152a" }]}>
          <Text style={[styles.highlightTitle, { color: "#DAA520" }]}>
            O Ouro da Sombra: Protocolo Hermético de Transmutação
          </Text>
          {shadow.transmutation.map((tp, tIdx) => (
            <Text key={tIdx} style={[styles.highlightText, { color: "#e0d8c0", marginBottom: 3 }]}>
              {tp}
            </Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 8: CICLO TEMPORAL: ANO PESSOAL 2026                   */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_07: ANO_PESSOAL_2026 // CICLO_TEMPORAL</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.personalYear.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>CICLO ANUAL: {pillars.personalYear.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.personalYear.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.personalYear.element.toUpperCase()} • FREQUÊNCIA: {pillars.personalYear.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.personalYear.dictum ? (
          <View style={styles.dictumBox}>
            <Text style={styles.dictumText}>"{pillars.personalYear.dictum}"</Text>
          </View>
        ) : null}

        {pillars.personalYear.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Plano Estratégico 2026: Janelas de Oportunidade:</Text>
          <Text style={styles.highlightText}>
            O Ano Pessoal {pillars.personalYear.number} ({pillars.personalYear.archetype}) dita o ritmo das marés materiais e espirituais em 2026. Alinhe investimentos, projetos e contratos com essa dinâmica cósmica para navegar com o vento a favor.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 9: DOM NATALÍCIO (TALENTO INATO DE NASCIMENTO)        */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_08: DOM_NATALICIO // TALENTO_INATO</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.birthday.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.birthday.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.birthday.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.birthday.element.toUpperCase()} • VIRTUDE: {pillars.birthday.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.birthday.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Ativação do Dom Nato:</Text>
          <Text style={styles.highlightText}>
            O Dia do seu Nascimento ({pillars.birthday.number}) representa o recurso de emergência e a ferramenta inata concedida à sua alma. Recorra a essa energia em momentos de decisão crítica para desbloquear soluções imediatas.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 10: MISSÃO DA MATURIDADE (35-40 ANOS EM DIANTE)       */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_09: MATURIDADE // CONVERSAO_FINAL</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.maturity.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.maturity.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
              {pillars.maturity.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENTO: {pillars.maturity.element.toUpperCase()} • SÍNTESE: {pillars.maturity.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.maturity.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Consagração do Legado:</Text>
          <Text style={styles.highlightText}>
            A vibração {pillars.maturity.number} ({pillars.maturity.archetype}) atua como a síntese entre seu Destino e sua Expressão. É o legado definitivo que floresce na maturidade e ecoa na memória dos que herdam suas obras.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* UPGRADE ORDER BUMP: DOSSIÊ DE DÍVIDAS KÁRMICAS (13, 14, 16, 19) */}
      {/* ============================================================ */}
      {orderBumps?.karmicDebt?.active && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTag}>UPGRADE_01: DOSSIE_KARMICO // TRANSMUTACAO_ANCESTRAL</Text>
            <Text style={styles.headerName}>{profile.fullName}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520" }}>KÁRMA</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Dossiê Exclusivo de Dívidas Kármicas</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
                PROTOCOLOS 13, 14, 16 E 19 DE RETIFICAÇÃO CÓSMICA
              </Text>
              <Text style={styles.heroSubtitle}>
                ALQUIMIA DE MEMÓRIAS ANCESTRAIS • LIBERAÇÃO DO FLUXO DE ABUNDÂNCIA
              </Text>
            </View>
          </View>

          {/* Diagnóstico do Consultante */}
          <View style={[styles.highlightBox, { borderColor: "#DAA520", padding: 7, marginVertical: 3 }]}>
            <Text style={styles.highlightTitle}>Diagnóstico Nominal & Natal de Dívida Kármica:</Text>
            <Text style={[styles.highlightText, { fontSize: 8.2, color: "#f0eedb" }]}>
              {orderBumps.karmicDebt.statusText}
            </Text>
          </View>

          {/* Grid 2x2 com as 4 Dívidas */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 4 }}>
            {orderBumps.karmicDebt.items.map((item, idx) => {
              const isDetected = orderBumps.karmicDebt?.identifiedDebts.includes(item.number);
              return (
                <View
                  key={idx}
                  style={{
                    width: "49%",
                    backgroundColor: "#111124",
                    border: isDetected ? "1.5pt solid #DAA520" : "0.5pt solid #2d2d4a",
                    borderRadius: 4,
                    padding: 6,
                    marginBottom: 5,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5pt solid #252542", paddingBottom: 2, marginBottom: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ backgroundColor: "#1c1c38", border: "1pt solid #DAA520", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>
                        <Text style={{ fontSize: 7.8, fontWeight: "bold", color: "#DAA520" }}>{item.number} ➔ {item.transmutedTo}</Text>
                      </View>
                      <Text style={{ fontSize: 7.2, fontWeight: "bold", color: "#ffffff" }}>Dívida {item.number}</Text>
                    </View>
                    <Text style={{ fontSize: 6.2, color: isDetected ? "#DAA520" : "#70708a", fontWeight: "bold" }}>
                      {isDetected ? "● DETECTADO" : "PREVENTIVO"}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 6.8, color: "#DAA520", fontStyle: "italic", marginBottom: 2 }}>
                    {item.theme}
                  </Text>
                  
                  <Text style={{ fontSize: 6.2, color: "#8e8ea8", fontWeight: "bold", marginTop: 1 }}>DIAGNÓSTICO:</Text>
                  <Text style={{ fontSize: 6.6, color: "#c8c8dc", lineHeight: 1.25, marginBottom: 2 }}>{item.diagnosis}</Text>

                  <Text style={{ fontSize: 6.2, color: "#8e8ea8", fontWeight: "bold", marginTop: 1 }}>SINTOMAS NO PLANO FÍSICO:</Text>
                  <Text style={{ fontSize: 6.6, color: "#c8c8dc", lineHeight: 1.25, marginBottom: 2 }}>{item.symptoms}</Text>

                  <Text style={{ fontSize: 6.2, color: "#DAA520", fontWeight: "bold", marginTop: 1 }}>ALQUIMIA & PROTOCOLO:</Text>
                  <Text style={{ fontSize: 6.6, color: "#f7e8bd", lineHeight: 1.25, backgroundColor: "#181830", padding: 3, borderRadius: 2 }}>{item.protocol}</Text>
                </View>
              );
            })}
          </View>

          {/* Decreto de Revogação Kármica */}
          <View style={[styles.dictumBox, { borderLeftColor: "#DAA520", backgroundColor: "#111124", padding: 7, marginVertical: 2 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold", color: "#DAA520", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Protocolo de Revogação & Decreto de Quitação Cósmica:
            </Text>
            <Text style={{ fontSize: 7.5, fontStyle: "italic", color: "#f5ecd0", lineHeight: 1.35 }}>
              "{orderBumps.karmicDebt.manifestationDecree}"
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
          </View>
        </Page>
      )}

      {/* ============================================================ */}
      {/* UPGRADE ORDER BUMP: GUIA ESTRATÉGICO DO ANO PESSOAL 2026     */}
      {/* ============================================================ */}
      {orderBumps?.personalYearMonths?.active && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTag}>UPGRADE_02: CRONOGRAMA_2026 // NAVEGACAO_MES_A_MES</Text>
            <Text style={styles.headerName}>{profile.fullName}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#DAA520" }}>2026</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Guia Estratégico 2026 Mês a Mês</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#DAA520", marginTop: 1 }}>
                ANO PESSOAL {orderBumps.personalYearMonths.personalYear} — {orderBumps.personalYearMonths.yearArchetype}
              </Text>
              <Text style={styles.heroSubtitle}>
                TIMING PITAGÓRICO DE JANEIRO A DEZEMBRO • PICOS DE INVESTIMENTO & COLHEITA
              </Text>
            </View>
          </View>

          {/* Grid 2 colunas com os 12 meses */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 3 }}>
            {orderBumps.personalYearMonths.months.map((m, mIdx) => (
              <View
                key={mIdx}
                style={{
                  width: "49%",
                  backgroundColor: "#111124",
                  border: "0.5pt solid #2d2d4a",
                  borderRadius: 4,
                  padding: 4,
                  marginBottom: 3,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5pt solid #222238", paddingBottom: 1, marginBottom: 2 }}>
                  <Text style={{ fontSize: 7.5, fontWeight: "bold", color: "#ffffff" }}>
                    {m.monthName}
                  </Text>
                  <View style={{ backgroundColor: "#1c1c38", border: "1pt solid #DAA520", paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 }}>
                    <Text style={{ fontSize: 6.5, fontWeight: "bold", color: "#DAA520" }}>Mês {m.personalMonthNumber}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }}>
                  <Text style={{ fontSize: 6.5, color: "#DAA520", fontWeight: "bold" }}>{m.archetype}</Text>
                  <Text style={{ fontSize: 6.2, color: "#8e8ea8" }}>{m.theme}</Text>
                </View>

                <Text style={{ fontSize: 6.5, color: "#c8c8dc", lineHeight: 1.2 }}>
                  {m.guidance}
                </Text>
              </View>
            ))}
          </View>

          {/* Caixa de Diretriz Executiva de Timing */}
          <View style={[styles.highlightBox, { borderColor: "#DAA520", backgroundColor: "#111124", padding: 6, marginVertical: 2 }]}>
            <Text style={[styles.highlightTitle, { fontSize: 7.6 }]}>Diretriz Executiva de Timing & Fluxo Anual:</Text>
            <Text style={[styles.highlightText, { fontSize: 7.2, color: "#f2ebd6", lineHeight: 1.3 }]}>
              {orderBumps.personalYearMonths.executiveAdvice}
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
          </View>
        </Page>
      )}

      {/* ============================================================ */}
      {/* PÁGINA FINAL: ATIVAÇÃO HERMÉTICA & DECRETO DE MANIFESTAÇÃO    */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>LOG_10: ATIVACAO_HERMETICA // DECRETO_DE_MANIFESTACAO</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Comando de Manifestação & Código Numérico</Text>
        <Text style={styles.paragraph}>
          A numerologia hermética não é um estudo passivo sobre fatalidades do destino; é uma ciência aplicada de sintonização vibracional. Uma vez conhecidas as coordenadas da sua matriz, cabe à sua consciência ativa comandar a realidade material.
        </Text>

        {/* Cartão de Ativação do Código de Abundância */}
        <View style={[styles.highlightBox, { borderColor: "#DAA520", padding: 12, marginVertical: 8, alignItems: "center" }]}>
          <Text style={{ fontSize: 8.5, color: "#8e8ea8", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" }}>
            CÓDIGO NUMÉRICO DE ATIVAÇÃO DE ABUNDÂNCIA
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#DAA520", letterSpacing: 5, marginVertical: 4 }}>
            {activation.abundanceCode}
          </Text>
          <Text style={{ fontSize: 7.8, color: "#d8d8e8", textAlign: "center", lineHeight: 1.4, paddingHorizontal: 16 }}>
            Entone ou visualize esta sequência numérica de 7 dígitos ao despertar ou antes de tomar decisões financeiras críticas. Ela sintetiza a ressonância harmônica entre seu Caminho de Vida e seu Potencial de Expressão.
          </Text>
        </View>

        {/* Caixa Solene do Decreto */}
        <View style={[styles.dictumBox, { borderLeftColor: "#DAA520", backgroundColor: "#111124", padding: 12, marginVertical: 6 }]}>
          <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#DAA520", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            Decreto Hermético de Soberania Pessoal:
          </Text>
          <Text style={{ fontSize: 9.4, fontStyle: "italic", color: "#f5ecd0", lineHeight: 1.5, textAlign: "justify" }}>
            "{activation.manifestationDecree}"
          </Text>
        </View>

        {/* Certificação e Autenticidade */}
        <View style={[styles.highlightBox, { marginTop: 8, padding: 10 }]}>
          <Text style={styles.highlightTitle}>Certificação de Conclusão do Dossiê:</Text>
          <Text style={styles.highlightText}>
            Este documento representa o mapeamento analítico completo da matriz vibracional de {profile.fullName}, calculado rigorosamente a partir da tábua pitagórica e das leis de correspondência hermética. Guarde este dossiê como uma bússola permanente para suas grandes decisões.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "0.5pt solid #252542" }}>
            <Text style={{ fontSize: 7, color: "#606078" }}>CHAVE DE AUTENTICAÇÃO: DVX-PITAGORAS-2026-OK</Text>
            <Text style={{ fontSize: 7, color: "#DAA520", fontWeight: "bold" }}>SITUAÇÃO: ATIVADO & HOMOLOGADO</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PROTOCOLO PITAGÓRICO © 2026</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PÁGINA ${pageNumber} DE ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};
