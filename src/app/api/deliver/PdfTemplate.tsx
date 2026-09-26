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
    backgroundColor: "#090807",
    fontFamily: "Helvetica",
    color: "#ffffff",
  },
  coverPage: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#090807",
    border: "1pt solid #393225",
    padding: 28,
  },
  goldBorder: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    border: "1pt solid #BC8E3B",
  },
  coverBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 3,
    border: "1pt solid #FCD34D",
    backgroundColor: "#14120f",
    marginBottom: 16,
  },
  coverBadgeText: {
    fontSize: 8.5,
    color: "#FCD34D",
    fontWeight: "bold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  coverBrand: {
    fontSize: 13,
    color: "#F7EEDB",
    fontFamily: "Times-Roman",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  coverBrandCaption: {
    fontSize: 6.5,
    color: "#BC8E3B",
    letterSpacing: 3,
    marginBottom: 18,
  },
  coverNumber: {
    fontSize: 58,
    color: "#FCD34D",
    fontFamily: "Times-Roman",
    lineHeight: 1,
    textAlign: "center",
  },
  coverNumberLabel: {
    fontSize: 7,
    color: "#9A9182",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    color: "#FCD34D",
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
    backgroundColor: "#11100e",
    border: "1pt solid #393225",
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
    color: "#FCD34D",
    letterSpacing: 1.5,
  },
  coreSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 7,
    marginTop: 10,
    marginBottom: 16,
    width: "92%",
  },
  summaryPill: {
    width: "31.5%",
    backgroundColor: "#14120f",
    border: "0.7pt solid #393225",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  summaryPillLabel: {
    fontSize: 7,
    color: "#B8B0A2",
    textTransform: "uppercase",
    marginBottom: 2,
    textAlign: "center",
  },
  summaryPillNum: {
    fontSize: 17,
    color: "#FCD34D",
    fontWeight: "bold",
  },
  summaryPillTitle: {
    fontSize: 7,
    color: "#D5CFC4",
    textAlign: "center",
    marginTop: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1pt solid #393225",
    paddingBottom: 6,
    marginBottom: 10,
  },
  headerTag: {
    fontSize: 8.5,
    color: "#FCD34D",
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerName: {
    fontSize: 8.4,
    color: "#9A9182",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 13.5,
    color: "#FCD34D",
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  heroCard: {
    backgroundColor: "#11100e",
    border: "1pt solid #BC8E3B",
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
    backgroundColor: "#211d16",
    border: "1pt solid #BC8E3B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  heroBadgeText: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#FCD34D",
  },
  heroTitle: {
    fontSize: 11.5,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    fontSize: 9,
    color: "#FCD34D",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dictumBox: {
    backgroundColor: "#14120f",
    borderLeft: "2.5pt solid #BC8E3B",
    padding: 7,
    marginBottom: 8,
  },
  dictumText: {
    fontSize: 8.8,
    fontStyle: "italic",
    color: "#F3E6C8",
    lineHeight: 1.38,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "#DED7CA",
    marginBottom: 6.5,
    textAlign: "justify",
  },
  highlightBox: {
    backgroundColor: "#14120f",
    border: "1pt solid #393225",
    borderRadius: 4,
    padding: 8,
    marginTop: 5,
  },
  highlightTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FCD34D",
    letterSpacing: 1,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  highlightText: {
    fontSize: 8.9,
    color: "#B8B0A2",
    lineHeight: 1.38,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 42,
    right: 42,
    borderTop: "0.5pt solid #393225",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#796F60",
    letterSpacing: 1,
  },
  pageNumber: {
    fontSize: 7.5,
    color: "#FCD34D",
    fontWeight: "bold",
  },
});

export const NumerologyPDFDocument = ({ name, birthDate, content }: { name: string, birthDate: string, content: NumerologyContent }) => {
  const { profile, gematria, pillars, shadow, activation, orderBumps } = content;
  const referenceYear = profile.referenceYear || 2026;

  return (
    <Document title={`Pythagorean Destiny Map - ${name}`}>
      {/* ============================================================ */}
      {/* PAGE 1: COVER - DARK TECH LUXURY AESTHETIC                   */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={styles.goldBorder} />

          <Text style={styles.coverBrand}>DestinyVox</Text>
          <Text style={styles.coverBrandCaption}>NUMEROLOGY</Text>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>YOUR PERSONAL NUMBER MAP</Text>
          </View>

          <Text style={styles.coverNumber}>{pillars.lifePath.number}</Text>
          <Text style={styles.coverNumberLabel}>Your Life Path Number</Text>

          <Text style={styles.title}>Your Numerology Profile</Text>
          <Text style={styles.subtitle}>A PERSONAL GUIDE TO THE PATTERNS IN YOUR NAME AND BIRTH DATE</Text>

          <View style={styles.consultantCard}>
            <Text style={{ fontSize: 8, color: "#FCD34D", letterSpacing: 3, marginBottom: 4, textTransform: "uppercase" }}>
              PREPARED FOR
            </Text>
            <Text style={styles.consultantName}>{profile.fullName}</Text>
            <Text style={styles.birthDate}>BIRTH DATE: {profile.birthDate}</Text>
          </View>

          {/* 5 Pillars in Cover Grid */}
          <View style={styles.coreSummaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Life Path</Text>
              <Text style={styles.summaryPillNum}>{pillars.lifePath.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.lifePath.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Expression</Text>
              <Text style={styles.summaryPillNum}>{pillars.expression.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.expression.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Soul Urge</Text>
              <Text style={styles.summaryPillNum}>{pillars.soulUrge.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.soulUrge.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Personality</Text>
              <Text style={styles.summaryPillNum}>{pillars.personality.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.personality.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Attitude</Text>
              <Text style={styles.summaryPillNum}>{pillars.attitude.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.attitude.archetype}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Year {referenceYear}</Text>
              <Text style={styles.summaryPillNum}>{pillars.personalYear.number}</Text>
              <Text style={styles.summaryPillTitle}>{pillars.personalYear.archetype}</Text>
            </View>
          </View>

          {/* Purchased Upgrade/Order Bumps Badges on Cover */}
          {((orderBumps?.karmicDebt?.active) || (orderBumps?.personalYearMonths?.active)) && (
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10, marginBottom: 2 }}>
              {orderBumps?.karmicDebt?.active && (
                <View style={{ backgroundColor: "#211C13", border: "1pt solid #FCD34D", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                  <Text style={{ fontSize: 6.8, color: "#FCD34D", fontWeight: "bold", letterSpacing: 0.8 }}>
                    ★ KARMIC DEBTS DOSSIER INCLUDED
                  </Text>
                </View>
              )}
              {orderBumps?.personalYearMonths?.active && (
                <View style={{ backgroundColor: "#211C13", border: "1pt solid #FCD34D", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                  <Text style={{ fontSize: 6.8, color: "#FCD34D", fontWeight: "bold", letterSpacing: 0.8 }}>
                    ★ {referenceYear} MONTH-BY-MONTH GUIDE INCLUDED
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ marginTop: 18, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: "#9A9182", letterSpacing: 1.5, marginBottom: 3 }}>
              A THOUGHTFUL FRAMEWORK FOR SELF-REFLECTION
            </Text>
            <Text style={{ fontSize: 7, color: "#796F60", letterSpacing: 1 }}>
              CREATED FOR {profile.firstName.toUpperCase()}  |  DESTINYVOX
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 2: VIBRATIONAL MATRIX & GEMATRIA WITH DIDACTIC SUMS      */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>NAME AND BIRTH DATE NUMBERS</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <Text style={styles.sectionTitle}>The Science of Vibration & Nominal Gematria</Text>
        <Text style={styles.paragraph}>
          In Pythagorean cosmology, each letter and phoneme emits an invariable mathematical frequency. The birth certificate name is not a linguistic accident; it is the sonic code that magnetized consciousness for manifestation on the physical plane. Below is the mathematical breakdown demonstrating the exact sums.
        </Text>

        {/* Decomposição Nominal Didática com '+' */}
        <View style={[styles.highlightBox, { marginVertical: 6, padding: 8 }]}>
          <Text style={styles.highlightTitle}>Phonetic Breakdown by Word (Values with '+'):</Text>
          <View style={{ flexDirection: "column", gap: 5, marginVertical: 4 }}>
            {gematria.words.map((w, wIdx) => (
              <View key={wIdx} style={{ backgroundColor: "#211D16", padding: 5, borderRadius: 4, border: "0.5pt solid #4B412E" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#ffffff" }}>{w.word}</Text>
                  <Text style={{ fontSize: 7.5, color: "#FCD34D", fontWeight: "bold" }}>Total: {w.sum} ➔ Reduction: {w.reductionString}</Text>
                </View>
                <Text style={{ fontSize: 7.5, color: "#C8BFAF" }}>
                  {w.additionString}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 7.5, color: "#FCD34D", marginTop: 3 }}>
            Total Gross Nominal Sum: {gematria.totalSum} points ➔ Theosophical Reduction: {gematria.expressionNumber}
          </Text>
        </View>

        {/* Cálculo da Data com '+' */}
        {gematria.dateCalculationString ? (
          <View style={[styles.highlightBox, { marginVertical: 5, padding: 8, borderColor: "#FCD34D" }]}>
            <Text style={styles.highlightTitle}>Mathematical Calculation of Birth Date (Life Path):</Text>
            <Text style={{ fontSize: 8, color: "#ffffff", marginTop: 2 }}>
              Date: {profile.birthDate} ➔ {gematria.dateCalculationString} = {pillars.lifePath.number}
            </Text>
          </View>
        ) : null}

        {/* 3 Forças Nominais com '+' */}
        <View style={{ flexDirection: "row", gap: 6, marginVertical: 6 }}>
          <View style={[styles.summaryPill, { flex: 1, padding: 7 }]}>
            <Text style={styles.summaryPillLabel}>Vowels (Soul Urge)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15 }]}>{gematria.soulUrgeNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#9A9182", marginTop: 1 }}>Sum: {gematria.vowelsSum}</Text>
            <Text style={{ fontSize: 7, color: "#D5CFC4", textAlign: "center", marginTop: 2 }}>The secret cry of your essence</Text>
          </View>
          <View style={[styles.summaryPill, { flex: 1, padding: 7 }]}>
            <Text style={styles.summaryPillLabel}>Consonants (Personality)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15 }]}>{gematria.personalityNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#9A9182", marginTop: 1 }}>Sum: {gematria.consonantsSum}</Text>
            <Text style={{ fontSize: 7, color: "#D5CFC4", textAlign: "center", marginTop: 2 }}>The social attire and presence</Text>
          </View>
          <View style={[styles.summaryPill, { flex: 1, padding: 7, borderColor: "#FCD34D" }]}>
            <Text style={[styles.summaryPillLabel, { color: "#FCD34D" }]}>Total (Expression)</Text>
            <Text style={[styles.summaryPillNum, { fontSize: 15, color: "#FCD34D" }]}>{gematria.expressionNumber}</Text>
            <Text style={{ fontSize: 6.8, color: "#9A9182", marginTop: 1 }}>Sum: {gematria.totalSum}</Text>
            <Text style={{ fontSize: 7, color: "#D5CFC4", textAlign: "center", marginTop: 2 }}>Your realizing mark in the world</Text>
          </View>
        </View>

        <View style={[styles.highlightBox, { marginTop: 6 }]}>
          <Text style={styles.highlightTitle}>The 8 Calculated Pythagorean Pillars:</Text>
          <Text style={styles.highlightText}>
            • Life Path: {pillars.lifePath.number} ({pillars.lifePath.archetype}) — The central course of destiny.{'\n'}
            • Expression: {pillars.expression.number} ({pillars.expression.archetype}) — Your practical tools for value generation.{'\n'}
            • Soul Urge: {pillars.soulUrge.number} ({pillars.soulUrge.archetype}) — The affective and animic fuel.{'\n'}
            • Personality: {pillars.personality.number} ({pillars.personality.archetype}) — The relational interface with the world.{'\n'}
            • Attitude: {pillars.attitude.number} ({pillars.attitude.archetype}) — The initial reaction and approach to life.{'\n'}
            • Personal Year {referenceYear}: {pillars.personalYear.number} ({pillars.personalYear.archetype}) — The temporal climate of this annual cycle.{'\n'}
            • Congenital Gift: {pillars.birthday.number} ({pillars.birthday.archetype}) — The innate talent brought at birth.{'\n'}
            • Maturity: {pillars.maturity.number} ({pillars.maturity.archetype}) — The consecration from 35-40 years onward.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 3: LIFE PATH (CENTRAL DESTINY)                          */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR LIFE PATH</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.lifePath.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.lifePath.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.lifePath.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.lifePath.element.toUpperCase()} • DIRECTIVE: {pillars.lifePath.keywords.toUpperCase()}
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
          <Text style={styles.highlightTitle}>Destiny Realization:</Text>
          <Text style={styles.highlightText}>
            To manifest the fullness of Life Path {pillars.lifePath.number}, align your daily decisions with the frequency of the {pillars.lifePath.archetype}. Reject self-sabotage and assume the conscious leadership of your route.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 4: EXPRESSION POTENTIAL (VOCATION AND TALENT)           */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR EXPRESSION</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.expression.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.expression.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.expression.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.expression.element.toUpperCase()} • VECTOR: {pillars.expression.keywords.toUpperCase()}
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
          <Text style={styles.highlightTitle}>Vocational Alignment & Wealth Generation:</Text>
          <Text style={styles.highlightText}>
            The vibration {pillars.expression.number} is the channel through which your ideas are converted into tangible value. Acting in harmony with the archetype of the {pillars.expression.archetype} dissipates professional friction and attracts legitimate material abundance.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 5: SOUL URGE (INNER MOTIVATION / ANIMA)                 */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR INNER MOTIVATION</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.soulUrge.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.soulUrge.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.soulUrge.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.soulUrge.element.toUpperCase()} • CORE: {pillars.soulUrge.keywords.toUpperCase()}
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
          <Text style={styles.highlightTitle}>Inner Sanctuary & Affective Fuel:</Text>
          <Text style={styles.highlightText}>
            The Soul Urge {pillars.soulUrge.number} ({pillars.soulUrge.archetype}) represents your most inviolable needs. Honoring this secret flame prevents spiritual exhaustion and sustains the integrity of your affective journey.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 6: PERSONALITY (THE SOCIAL MASK AND PRESENCE)           */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR SOCIAL PRESENCE</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.personality.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.personality.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.personality.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.personality.element.toUpperCase()} • PRESENCE: {pillars.personality.keywords.toUpperCase()}
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
          <Text style={styles.highlightTitle}>Mastery of Presence & Social Interface:</Text>
          <Text style={styles.highlightText}>
            The Personality {pillars.personality.number} is the shield and magnetic business card of your being. When calibrated with wisdom, it commands immediate respect, opens strategic doors, and protects your intimacy against unnecessary invasions.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 7: RELATIONSHIPS & WORK THEMES                          */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR NUMBERS IN EVERYDAY LIFE</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Relationships & Connection</Text>
        <Text style={styles.paragraph}>
          Your Soul Urge points to the emotional conditions that help you feel fulfilled, while your Personality describes the qualities people tend to notice first. Read together, they reveal where your private needs and social style naturally support each other - and where they may ask for clearer communication.
        </Text>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Inner needs · Soul Urge {pillars.soulUrge.number} ({pillars.soulUrge.archetype})</Text>
          <Text style={styles.highlightText}>Themes of {pillars.soulUrge.keywords.toLowerCase()} can shape the closeness, trust, and communication you seek. Notice which needs you state openly and which you may expect someone else to intuit. Naming them with care makes it easier to build relationships that feel both supportive and genuine.</Text>
        </View>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Social presence · Personality {pillars.personality.number} ({pillars.personality.archetype})</Text>
          <Text style={styles.highlightText}>Qualities of {pillars.personality.keywords.toLowerCase()} influence the impression you make and the role you may take in a group. Compare that outward style with what you need privately; a small gap between the two is normal. Let people see more of your real preferences instead of relying on them to read the signals.</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Work & Purpose</Text>
        <Text style={styles.paragraph}>
          Your Expression describes abilities you can develop and contribute, while your Life Path points to themes that may keep returning as you grow. Use both as prompts to identify work that is practical, engaging, and connected to the kind of impact you want to make.
        </Text>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Ways of contributing · Expression {pillars.expression.number} ({pillars.expression.archetype})</Text>
          <Text style={styles.highlightText}>Look for projects that make room for {pillars.expression.keywords.toLowerCase()}. These qualities can become strengths through practice: choose one skill to deepen, seek useful feedback, and notice which tasks leave you focused rather than simply busy.</Text>
        </View>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Longer direction · Life Path {pillars.lifePath.number} ({pillars.lifePath.archetype})</Text>
          <Text style={styles.highlightText}>Themes of {pillars.lifePath.keywords.toLowerCase()} can help you evaluate goals, responsibilities, and the effect your work has on others. Treat this number as a compass rather than a fixed job title: choose the next opportunity that lets you use your strengths while building a more sustainable direction.</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 7: KARMIC ALCHEMY & SHADOW CHALLENGE                    */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>A PATTERN TO WORK WITH</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={[styles.heroCard, { borderColor: "#BC8E3B" }]}>
          <View style={[styles.heroBadge, { borderColor: "#BC8E3B" }]}>
            <Text style={[styles.heroBadgeText, { color: "#FCD34D" }]}>{shadow.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{shadow.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {shadow.title}
            </Text>
            <Text style={[styles.heroSubtitle, { color: "#BC8E3B" }]}>
              A REFLECTION POINT FOR GROWTH
            </Text>
          </View>
        </View>

        <View style={[styles.dictumBox, { borderLeftColor: "#BC8E3B" }]}>
          <Text style={styles.dictumText}>
            "That which you do not bring to the light of consciousness manifests in your life as destiny. The spiritual gold is hidden beneath the densest matter of your shadow."
          </Text>
        </View>

        {shadow.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={[styles.highlightBox, { borderColor: "#BC8E3B", backgroundColor: "#14120f" }]}>
          <Text style={[styles.highlightTitle, { color: "#FCD34D" }]}>
            The Gold of the Shadow: Hermetic Transmutation Protocol
          </Text>
          {shadow.transmutation.map((tp, tIdx) => (
            <Text key={tIdx} style={[styles.highlightText, { color: "#DED7CA", marginBottom: 3 }]}>
              {tp}
            </Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 8: TEMPORAL CYCLE: PERSONAL YEAR 2026                   */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR PERSONAL YEAR {referenceYear}</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.personalYear.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>ANNUAL CYCLE: {pillars.personalYear.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.personalYear.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.personalYear.element.toUpperCase()} • FREQUENCY: {pillars.personalYear.keywords.toUpperCase()}
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
          <Text style={styles.highlightTitle}>Strategic Plan {referenceYear}: Windows of Opportunity:</Text>
          <Text style={styles.highlightText}>
            The Personal Year {pillars.personalYear.number} ({pillars.personalYear.archetype}) dictates the rhythm of the material and spiritual tides in {referenceYear}. Align investments, projects, and contracts with this cosmic dynamic to sail with the wind in your favor.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 9: CONGENITAL GIFT (INNATE BIRTH TALENT)                */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR BIRTHDAY NUMBER</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.birthday.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.birthday.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.birthday.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.birthday.element.toUpperCase()} • VIRTUE: {pillars.birthday.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.birthday.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Activation of the Innate Gift:</Text>
          <Text style={styles.highlightText}>
            The Day of your Birth ({pillars.birthday.number}) represents the emergency resource and the innate tool granted to your soul. Resort to this energy in moments of critical decision to unlock immediate solutions.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 10: MATURITY MISSION (35-40 YEARS ONWARD)               */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>YOUR MATURITY NUMBER</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{pillars.maturity.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{pillars.maturity.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
              {pillars.maturity.archetype}
            </Text>
            <Text style={styles.heroSubtitle}>
              ELEMENT: {pillars.maturity.element.toUpperCase()} • SYNTHESIS: {pillars.maturity.keywords.toUpperCase()}
            </Text>
          </View>
        </View>

        {pillars.maturity.paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Consecration of the Legacy:</Text>
          <Text style={styles.highlightText}>
            The vibration {pillars.maturity.number} ({pillars.maturity.archetype}) acts as the synthesis between your Destiny and your Expression. It is the definitive legacy that blooms in maturity and echoes in the memory of those who inherit your works.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>

      {/* ============================================================ */}
      {/* UPGRADE ORDER BUMP: KARMIC DEBT DOSSIER (13, 14, 16, 19)      */}
      {/* ============================================================ */}
      {orderBumps?.karmicDebt?.active && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTag}>UPGRADE_01: KARMIC_DOSSIER // ANCESTRAL_TRANSMUTATION</Text>
            <Text style={styles.headerName}>{profile.fullName}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FCD34D" }}>∞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Exclusive Karmic Debts Dossier</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
                PROTOCOLS 13, 14, 16 AND 19 OF COSMIC RECTIFICATION
              </Text>
              <Text style={styles.heroSubtitle}>
                ALCHEMY OF ANCESTRAL MEMORIES • LIBERATION OF THE ABUNDANCE FLOW
              </Text>
            </View>
          </View>

          {/* Consultant Diagnosis */}
          <View style={[styles.highlightBox, { borderColor: "#FCD34D", padding: 7, marginVertical: 3 }]}>
            <Text style={styles.highlightTitle}>Nominal & Natal Diagnosis of Karmic Debt:</Text>
            <Text style={[styles.highlightText, { fontSize: 8.2, color: "#F7EEDB" }]}>
              {orderBumps.karmicDebt.statusText}
            </Text>
          </View>

          {/* 2x2 Grid with the 4 Debts */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 4 }}>
            {orderBumps.karmicDebt.items.map((item, idx) => {
              const isDetected = orderBumps.karmicDebt?.identifiedDebts.includes(item.number);
              return (
                <View
                  key={idx}
                  style={{
                    width: "49%",
                    backgroundColor: "#11100E",
                    border: isDetected ? "1.5pt solid #FCD34D" : "0.5pt solid #393225",
                    borderRadius: 4,
                    padding: 6,
                    marginBottom: 5,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5pt solid #393225", paddingBottom: 2, marginBottom: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ backgroundColor: "#292216", border: "1pt solid #FCD34D", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>
                        <Text style={{ fontSize: 7.8, fontWeight: "bold", color: "#FCD34D" }}>{item.number} ➔ {item.transmutedTo}</Text>
                      </View>
                      <Text style={{ fontSize: 7.2, fontWeight: "bold", color: "#ffffff" }}>Debt {item.number}</Text>
                    </View>
                    <Text style={{ fontSize: 6.2, color: isDetected ? "#FCD34D" : "#796F60", fontWeight: "bold" }}>
                      {isDetected ? "● DETECTED" : "PREVENTIVE"}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 6.8, color: "#FCD34D", fontStyle: "italic", marginBottom: 2 }}>
                    {item.theme}
                  </Text>
                  
                  <Text style={{ fontSize: 6.2, color: "#9A9182", fontWeight: "bold", marginTop: 1 }}>DIAGNOSIS:</Text>
                  <Text style={{ fontSize: 6.6, color: "#C8BFAF", lineHeight: 1.25, marginBottom: 2 }}>{item.diagnosis}</Text>

                  <Text style={{ fontSize: 6.2, color: "#9A9182", fontWeight: "bold", marginTop: 1 }}>SYMPTOMS ON PHYSICAL PLANE:</Text>
                  <Text style={{ fontSize: 6.6, color: "#C8BFAF", lineHeight: 1.25, marginBottom: 2 }}>{item.symptoms}</Text>

                  <Text style={{ fontSize: 6.2, color: "#FCD34D", fontWeight: "bold", marginTop: 1 }}>ALCHEMY & PROTOCOL:</Text>
                  <Text style={{ fontSize: 6.6, color: "#F3E6C8", lineHeight: 1.25, backgroundColor: "#211D16", padding: 3, borderRadius: 2 }}>{item.protocol}</Text>
                </View>
              );
            })}
          </View>

          {/* Karmic Revocation Decree */}
          <View style={[styles.dictumBox, { borderLeftColor: "#FCD34D", backgroundColor: "#11100E", padding: 7, marginVertical: 2 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold", color: "#FCD34D", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Revocation Protocol & Cosmic Settlement Decree:
            </Text>
            <Text style={{ fontSize: 7.5, fontStyle: "italic", color: "#F7EEDB", lineHeight: 1.35 }}>
              "{orderBumps.karmicDebt.manifestationDecree}"
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
          </View>
        </Page>
      )}

      {/* ============================================================ */}
      {/* UPGRADE ORDER BUMP: STRATEGIC GUIDE PERSONAL YEAR 2026       */}
      {/* ============================================================ */}
      {orderBumps?.personalYearMonths?.active && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTag}>UPGRADE_02: TIMELINE_{referenceYear} // MONTH_BY_MONTH_NAVIGATION</Text>
            <Text style={styles.headerName}>{profile.fullName}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#FCD34D" }}>{referenceYear}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Strategic Guide {referenceYear} Month by Month</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#FCD34D", marginTop: 1 }}>
                PERSONAL YEAR {orderBumps.personalYearMonths.personalYear} — {orderBumps.personalYearMonths.yearArchetype}
              </Text>
              <Text style={styles.heroSubtitle}>
                PYTHAGOREAN TIMING FROM JANUARY TO DECEMBER • PEAKS OF INVESTMENT & HARVEST
              </Text>
            </View>
          </View>

          {/* 2-column Grid with the 12 months */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 3 }}>
            {orderBumps.personalYearMonths.months.map((m, mIdx) => (
              <View
                key={mIdx}
                style={{
                  width: "49%",
                  backgroundColor: "#11100E",
                  border: "0.5pt solid #393225",
                  borderRadius: 4,
                  padding: 4,
                  marginBottom: 3,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5pt solid #393225", paddingBottom: 1, marginBottom: 2 }}>
                  <Text style={{ fontSize: 7.5, fontWeight: "bold", color: "#ffffff" }}>
                    {m.monthName}
                  </Text>
                  <View style={{ backgroundColor: "#292216", border: "1pt solid #FCD34D", paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 }}>
                    <Text style={{ fontSize: 6.5, fontWeight: "bold", color: "#FCD34D" }}>Month {m.personalMonthNumber}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }}>
                  <Text style={{ fontSize: 6.5, color: "#FCD34D", fontWeight: "bold" }}>{m.archetype}</Text>
                  <Text style={{ fontSize: 6.2, color: "#9A9182" }}>{m.theme}</Text>
                </View>

                <Text style={{ fontSize: 6.5, color: "#C8BFAF", lineHeight: 1.2 }}>
                  {m.guidance}
                </Text>
              </View>
            ))}
          </View>

          {/* Timing Executive Directive Box */}
          <View style={[styles.highlightBox, { borderColor: "#FCD34D", backgroundColor: "#11100E", padding: 6, marginVertical: 2 }]}>
            <Text style={[styles.highlightTitle, { fontSize: 7.6 }]}>Executive Timing Directive & Annual Flow:</Text>
            <Text style={[styles.highlightText, { fontSize: 7.2, color: "#F3E6C8", lineHeight: 1.3 }]}>
              {orderBumps.personalYearMonths.executiveAdvice}
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
          </View>
        </Page>
      )}

      {/* ============================================================ */}
      {/* FINAL PAGE: HERMETIC ACTIVATION & MANIFESTATION DECREE         */}
      {/* ============================================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTag}>PUT YOUR INSIGHT INTO ACTION</Text>
          <Text style={styles.headerName}>{profile.fullName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Manifestation Command & Numeric Code</Text>
        <Text style={styles.paragraph}>
          Hermetic numerology is not a passive study of destiny's fatalities; it is an applied science of vibrational tuning. Once the coordinates of your matrix are known, it is up to your active consciousness to command material reality.
        </Text>

        {/* Abundance Code Activation Card */}
        <View style={[styles.highlightBox, { borderColor: "#FCD34D", padding: 12, marginVertical: 8, alignItems: "center" }]}>
          <Text style={{ fontSize: 8.5, color: "#9A9182", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" }}>
            NUMERIC CODE FOR ABUNDANCE ACTIVATION
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FCD34D", letterSpacing: 5, marginVertical: 4 }}>
            {activation.abundanceCode}
          </Text>
          <Text style={{ fontSize: 7.8, color: "#D5CFC4", textAlign: "center", lineHeight: 1.4, paddingHorizontal: 16 }}>
            This combination brings together your Life Path, Expression, and Soul Urge numbers. Use it as a personal reflection prompt when setting intentions and considering the themes explored in this reading.
          </Text>
        </View>

        {/* Solemn Decree Box */}
        <View style={[styles.dictumBox, { borderLeftColor: "#FCD34D", backgroundColor: "#11100E", padding: 12, marginVertical: 6 }]}>
          <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#FCD34D", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            Hermetic Decree of Personal Sovereignty:
          </Text>
          <Text style={{ fontSize: 9.4, fontStyle: "italic", color: "#F7EEDB", lineHeight: 1.5, textAlign: "justify" }}>
            "{activation.manifestationDecree}"
          </Text>
        </View>

        {/* Certification and Authenticity */}
        <View style={[styles.highlightBox, { marginTop: 8, padding: 10 }]}>
          <Text style={styles.highlightTitle}>Dossier Completion Certification:</Text>
          <Text style={styles.highlightText}>
            This document represents the complete analytical mapping of {profile.fullName}'s vibrational matrix, rigorously calculated from the Pythagorean table and the laws of hermetic correspondence. Keep this dossier as a permanent compass for your major decisions.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "0.5pt solid #393225" }}>
            <Text style={{ fontSize: 7, color: "#796F60" }}>AUTHENTICATION KEY: DVX-PYTHAGORAS-{referenceYear}-OK</Text>
            <Text style={{ fontSize: 7, color: "#FCD34D", fontWeight: "bold" }}>STATUS: ACTIVATED & HOMOLOGATED</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DESTINYVOX // PYTHAGOREAN PROTOCOL © {referenceYear}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};
