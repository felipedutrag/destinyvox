import {
  calculateFullNumerology, calculatePersonalYear, calculatePersonalMonth,
  calculatePersonalDay, getArchetype, getSoulDictum,
} from "../utils/numerology";
import {
  LIFE_PATH_INTERPRETATIONS, EXPRESSION_INTERPRETATIONS, SOUL_URGE_INTERPRETATIONS,
  PERSONALITY_INTERPRETATIONS, BIRTHDAY_INTERPRETATIONS, MATURITY_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS, MONTHLY_FORECAST_INTERPRETATIONS,
  DAILY_FORECAST_INTERPRETATIONS, interpolateFirstName,
} from "../utils/interpretations";
import type { ProductModule, Purchase } from "./map-products";

export type NumberReading = {
  id: string;
  label: string;
  value: number;
  group: "essence" | "cycles";
  subtitle: string;
  calculation: string;
  paragraphs: string[];
  reflection: string;
};

export type WebMap = {
  purchase?: Purchase;
  modules?: ProductModule[];
  upgradeMapId?: string;
  version: 2;
  name: string;
  birthDate: string;
  referenceDate: string;
  archetype: string;
  keywords: string[];
  dictum: string;
  readings: NumberReading[];
};

/** Calendar cycles are evaluated in the customer's Brazilian calendar, not the server timezone. */
export function brazilianDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function buildWebMap(name: string, birthDate: string, referenceDate = brazilianDate()): WebMap {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const profile = calculateFullNumerology(name, birthDate);
  const personalYear = calculatePersonalYear(birthDate, year);
  const personalMonth = calculatePersonalMonth(personalYear, month);
  const personalDay = calculatePersonalDay(personalMonth, day);
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 15)));
  const paragraphs = (text: string) => interpolateFirstName(text || "O nome informado não contém letras suficientes para este cálculo. Revise se você usou o nome completo de nascimento. Os demais números do seu mapa continuam disponíveis.", name).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const reading = (id: string, label: string, value: number, group: NumberReading["group"], subtitle: string, calculation: string, text: string, reflection: string): NumberReading => ({ id, label, value, group, subtitle, calculation, paragraphs: paragraphs(text), reflection });
  const archetype = getArchetype(profile.lifePath, "pt");
  return {
    version: 2, name, birthDate, referenceDate, archetype: archetype.title,
    keywords: archetype.keywords, dictum: getSoulDictum(profile.lifePath, "pt"),
    readings: [
      reading("caminho", "Caminho de Vida", profile.lifePath, "essence", "O fio que atravessa a sua história.", "Redução dos números da sua data de nascimento, preservando os mestres 11, 22 e 33.", LIFE_PATH_INTERPRETATIONS.pt[profile.lifePath], "Que escolha recente faz você sentir que está no seu próprio caminho?"),
      reading("expressao", "Expressão", profile.expression, "essence", "O que você coloca no mundo.", "Soma dos valores pitagóricos de todas as letras do seu nome completo de nascimento.", EXPRESSION_INTERPRETATIONS.pt[profile.expression], "Qual talento você gostaria de usar com mais liberdade?"),
      reading("alma", "Desejo da Alma", profile.soulUrge, "essence", "O que importa quando ninguém está olhando.", "Soma dos valores das vogais do seu nome de nascimento.", SOUL_URGE_INTERPRETATIONS.pt[profile.soulUrge], "O que você escolheria se não precisasse impressionar ninguém?"),
      reading("personalidade", "Personalidade", profile.personality, "essence", "A presença que chega antes das palavras.", "Soma dos valores das consoantes do seu nome de nascimento.", PERSONALITY_INTERPRETATIONS.pt[profile.personality], "A imagem que você transmite combina com o que sente por dentro?"),
      reading("aniversario", "Dia de Nascimento", profile.birthday, "essence", "Um talento que acompanha você desde o início.", "Redução do dia do seu nascimento, preservando os números mestres.", BIRTHDAY_INTERPRETATIONS.pt[profile.birthday], "O que é tão natural para você que às vezes parece não ter valor?"),
      reading("maturidade", "Maturidade", profile.maturity, "essence", "Quem você está aprendendo a se tornar.", "Soma e redução dos números de Caminho de Vida e Expressão.", MATURITY_INTERPRETATIONS.pt[profile.maturity], "Que parte de você ganhou espaço com a experiência?"),
      reading("ano", "Ano Pessoal", personalYear, "cycles", `O tema do seu ciclo em ${year}.`, `Dia e mês de nascimento somados ao ano ${year}, com redução de 1 a 9.`, YEARLY_FORECAST_INTERPRETATIONS.pt[personalYear], "O que merece sua atenção neste ano — e o que pode esperar?"),
      reading("mes", "Mês Pessoal", personalMonth, "cycles", `Uma lente para ${monthName}.`, `Ano Pessoal ${personalYear} + mês ${month}, com redução de 1 a 9.`, MONTHLY_FORECAST_INTERPRETATIONS.pt[personalMonth](monthName), "Qual pequeno compromisso pode dar um sentido novo a este mês?"),
      reading("dia", "Dia Pessoal", personalDay, "cycles", "Uma pausa para olhar o seu hoje.", `Mês Pessoal ${personalMonth} + dia ${day}, com redução de 1 a 9.`, DAILY_FORECAST_INTERPRETATIONS.pt[personalDay], "Que gesto simples deixaria seu dia mais alinhado com você?"),
    ],
  };
}
