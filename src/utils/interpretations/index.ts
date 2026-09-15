import {
  calculatePersonalMonth,
  calculatePersonalDay,
  getSoulDictum,
  type NumerologyProfile,
} from '../numerology';
import { LIFE_PATH_INTERPRETATIONS } from './lifePath';
import { EXPRESSION_INTERPRETATIONS } from './expression';
import { SHADOW_INTERPRETATIONS } from './shadow';
import {
  YEARLY_FORECAST_INTERPRETATIONS,
  MONTHLY_FORECAST_INTERPRETATIONS,
  DAILY_FORECAST_INTERPRETATIONS,
} from './cycles';
import { BIRTHDAY_INTERPRETATIONS } from './birthday';
import { MATURITY_INTERPRETATIONS } from './maturity';

export * from './lifePath';
export * from './expression';
export * from './shadow';
export * from './cycles';
export * from './soulUrge';
export * from './personality';
export * from './birthday';
export * from './maturity';
export * from './utils';

export type InterpretationLanguage = 'en' | 'pt' | 'es';

export function resolveInterpretationLang(language: string = 'en'): InterpretationLanguage {
  if (language.startsWith('pt')) return 'pt';
  if (language.startsWith('es')) return 'es';
  return 'en';
}

const MONTH_NAMES: Record<InterpretationLanguage, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

export interface CosmicInterpretation {
  destinyOverview: string;
  hiddenTalents: string;
  shadowAndChallenges: string;
  yearlyForecast: string;
  monthlyForecast: string;
  dailyForecast: string;
  cosmicMotto: string;
  birthdayTalent?: string | undefined;
  maturityMission?: string | undefined;
}

export function extractFirstName(fullName?: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const first = trimmed.split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function interpolateFirstName(text: string, fullNameOrFirstName?: string): string {
  if (!text) return '';
  const firstName = extractFirstName(fullNameOrFirstName);
  if (!firstName) {
    return text
      .replace(/^\{name\},\s*([a-z])/gm, (_, char) => char.toUpperCase())
      .replace(/\{name\},\s*/g, '')
      .replace(/,\s*\{name\}/g, '')
      .replace(/\{name\}/g, 'friend');
  }
  return text.replace(/\{name\}/g, firstName);
}

export function buildCosmicInterpretation(
  profile: NumerologyProfile,
  language: string = 'en',
  referenceDate: Date = new Date()
): CosmicInterpretation {
  const langKey = resolveInterpretationLang(language);
  const currentMonthNum = referenceDate.getMonth() + 1;
  const currentDayNum = referenceDate.getDate();

  const personalMonth = calculatePersonalMonth(profile.personalYear, currentMonthNum);
  const personalDay = calculatePersonalDay(personalMonth, currentDayNum);
  const monthName = MONTH_NAMES[langKey][currentMonthNum - 1] ?? MONTH_NAMES[langKey][0]!;

  const lpDict = LIFE_PATH_INTERPRETATIONS[langKey];
  const expDict = EXPRESSION_INTERPRETATIONS[langKey];
  const shadowDict = SHADOW_INTERPRETATIONS[langKey];
  const yearDict = YEARLY_FORECAST_INTERPRETATIONS[langKey];
  const monthDict = MONTHLY_FORECAST_INTERPRETATIONS[langKey];
  const dayDict = DAILY_FORECAST_INTERPRETATIONS[langKey];

  const rawDestinyOverview = lpDict[profile.lifePath] || lpDict[1]!;
  const rawHiddenTalents = expDict[profile.expression] || expDict[1]!;
  const rawShadowAndChallenges = shadowDict[profile.lifePath] || shadowDict[1]!;
  const rawYearlyForecast = yearDict[profile.personalYear] || yearDict[1]!;
  const rawMonthlyForecast = (monthDict[personalMonth] || monthDict[1]!)(monthName);
  const rawDailyForecast = dayDict[personalDay] || dayDict[1]!;
  const cosmicMotto = getSoulDictum(profile.lifePath, langKey);

  const destinyOverview = interpolateFirstName(rawDestinyOverview, profile.fullName);
  const hiddenTalents = interpolateFirstName(rawHiddenTalents, profile.fullName);
  const shadowAndChallenges = interpolateFirstName(rawShadowAndChallenges, profile.fullName);
  const yearlyForecast = interpolateFirstName(rawYearlyForecast, profile.fullName);
  const monthlyForecast = interpolateFirstName(rawMonthlyForecast, profile.fullName);
  const dailyForecast = interpolateFirstName(rawDailyForecast, profile.fullName);

  const birthdayDict = BIRTHDAY_INTERPRETATIONS[langKey] || {};
  const maturityDict = MATURITY_INTERPRETATIONS[langKey] || {};
  const rawBirthday = profile.birthday ? (birthdayDict[profile.birthday] || birthdayDict[1] || '') : '';
  const rawMaturity = profile.maturity ? (maturityDict[profile.maturity] || maturityDict[1] || '') : '';
  const birthdayTalent = rawBirthday ? interpolateFirstName(rawBirthday, profile.fullName) : undefined;
  const maturityMission = rawMaturity ? interpolateFirstName(rawMaturity, profile.fullName) : undefined;

  return {
    destinyOverview,
    hiddenTalents,
    shadowAndChallenges,
    yearlyForecast,
    monthlyForecast,
    dailyForecast,
    cosmicMotto,
    birthdayTalent,
    maturityMission,
  };
}
