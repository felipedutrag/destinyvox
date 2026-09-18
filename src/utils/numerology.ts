// Motor Matemático de Numerologia (Pitagórica e Caldéia)
// 100% Executável localmente no cliente e servidor sem depender de APIs externas.

export interface NumerologyProfile {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  lifePath: number; // Caminho da Vida / Destino
  expression: number; // Expressão / Missão
  soulUrge: number; // Desejo da Alma / Motivação (Vogais)
  personality: number; // Personalidade Exterior (Consoantes)
  birthday: number; // Número do Aniversário / Dom Inato (Dia de Nascimento)
  maturity: number; // Número da Maturidade / Realização Final (Caminho + Expressão)
  attitude: number; // Número de Atitude (Dia + Mês)
  personalYear: number; // Ano Pessoal Atual
  isMasterLifePath: boolean;
  isMasterExpression: boolean;
  isMasterBirthday?: boolean;
  isMasterMaturity?: boolean;
  isMasterAttitude?: boolean;
}

// Tabela Pitagórica Tradicional
const PYTHAGOREAN_TABLE: Record<string, number> = {
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

// Vogais para o Desejo da Alma (A, E, I, O, U e acentuadas)
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// Normalizar texto (remover acentos e caracteres especiais)
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

// Redução Teosófica preservando Números Mestres (11, 22, 33)
export function reduceToSingleDigitOrMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return n;
}

// Redução Teosófica estrita (1 a 9)
export function reduceStrictSingleDigit(n: number): number {
  while (n > 9) {
    n = n
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return n;
}

// Parser seguro de datas de nascimento (suporta YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY com fail-safe inteligente)
export function parseBirthDate(birthDateStr: string): { day: number; month: number; year: number } {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  let year = 1990, month = 1, day = 1;

  if (birthDateStr.includes('-')) {
    const parts = birthDateStr.split('-');
    if (parts[0] && parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      // DD-MM-YYYY (Formato brasileiro)
      day = parseInt(parts[0] ?? '1', 10);
      month = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2] ?? '1990', 10);
    }
  } else if (birthDateStr.includes('/')) {
    const parts = birthDateStr.split('/');
    if (parts[2] && parts[2].length === 4) {
      // DD/MM/YYYY (Padrão brasileiro: dia/mês/ano)
      day = parseInt(parts[0] ?? '1', 10);
      month = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2], 10);
    } else if (parts[0] && parts[0].length === 4) {
      // YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      day = parseInt(parts[0] ?? '1', 10);
      month = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2] ?? '1990', 10);
    }
  } else if (digits.length === 8) {
    // DDMMYYYY (Padrão brasileiro)
    day = parseInt(digits.slice(0, 2), 10);
    month = parseInt(digits.slice(2, 4), 10);
    year = parseInt(digits.slice(4, 8), 10);
  }

  // Fallback caso alguém passe invertido (mês > 12 e dia <= 12)
  if (month > 12 && day <= 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  return { day, month, year };
}

// 1. Caminho da Vida (Life Path): Soma do Dia + Mês + Ano de nascimento
export function calculateLifePath(birthDateStr: string): number {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return 1;

  const { day, month, year } = parseBirthDate(birthDateStr);
  const redDay = reduceToSingleDigitOrMaster(day);
  const redMonth = reduceToSingleDigitOrMaster(month);
  const redYear = reduceToSingleDigitOrMaster(year);

  return reduceToSingleDigitOrMaster(redDay + redMonth + redYear);
}

// Número do Aniversário (Birthday Number / Dia Natalício): Dom nato e talento inato
export function calculateBirthday(birthDateStr: string): number {
  const { day } = parseBirthDate(birthDateStr);
  return reduceToSingleDigitOrMaster(day);
}

// Número da Maturidade (Maturity Number / Realização Final): Síntese de Caminho + Expressão
export function calculateMaturity(lifePath: number, expression: number): number {
  return reduceToSingleDigitOrMaster(lifePath + expression);
}

// 2. Número de Expressão (também conhecido como Número do Destino): Soma de todas as letras do nome de certidão
export function calculateExpression(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    sum += PYTHAGOREAN_TABLE[char] || 0;
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 3. Desejo da Alma (Soul Urge / Motivação Íntima): Soma apenas das vogais
export function calculateSoulUrge(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    if (VOWELS.has(char)) {
      sum += PYTHAGOREAN_TABLE[char] || 0;
    }
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 4. Personalidade Exterior: Soma apenas das consoantes
export function calculatePersonality(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    if (!VOWELS.has(char)) {
      sum += PYTHAGOREAN_TABLE[char] || 0;
    }
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 5. Ano Pessoal: Dia + Mês de Nascimento + Ano Universal Corrente
export function calculatePersonalYear(birthDateStr: string, currentYear = new Date().getFullYear()): number {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return 1;

  const { day, month } = parseBirthDate(birthDateStr);
  const sum = reduceStrictSingleDigit(day) + reduceStrictSingleDigit(month) + reduceStrictSingleDigit(currentYear);
  return reduceStrictSingleDigit(sum);
}

// 6. Mês Pessoal: Ano Pessoal + Mês do Calendário Atual
export function calculatePersonalMonth(personalYear: number, currentMonth = new Date().getMonth() + 1): number {
  const sum = reduceStrictSingleDigit(personalYear) + reduceStrictSingleDigit(currentMonth);
  return reduceStrictSingleDigit(sum);
}

// 7. Dia Pessoal: Mês Pessoal + Dia do Calendário Atual
export function calculatePersonalDay(personalMonth: number, currentDay = new Date().getDate()): number {
  const sum = reduceStrictSingleDigit(personalMonth) + reduceStrictSingleDigit(currentDay);
  return reduceStrictSingleDigit(sum);
}

// Número de Atitude: Soma do Dia + Mês do Nascimento
export function calculateAttitude(birthDateStr: string): number {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return 1;
  const { day, month } = parseBirthDate(birthDateStr);
  return reduceToSingleDigitOrMaster(day + month);
}

// Gerar Perfil Numerológico Completo (7 Pilares Pitagóricos)
export function calculateFullNumerology(fullName: string, birthDate: string): NumerologyProfile {
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(fullName);
  const soulUrge = calculateSoulUrge(fullName);
  const personality = calculatePersonality(fullName);
  const birthday = calculateBirthday(birthDate);
  const maturity = calculateMaturity(lifePath, expression);
  const personalYear = calculatePersonalYear(birthDate);
  const attitude = calculateAttitude(birthDate);

  return {
    fullName,
    birthDate,
    lifePath,
    expression,
    soulUrge,
    personality,
    birthday,
    maturity,
    attitude,
    personalYear,
    isMasterLifePath: [11, 22, 33].includes(lifePath),
    isMasterExpression: [11, 22, 33].includes(expression),
    isMasterBirthday: [11, 22, 33].includes(birthday),
    isMasterMaturity: [11, 22, 33].includes(maturity),
    isMasterAttitude: [11, 22, 33].includes(attitude),
  };
}

export interface ArchetypeData {
  title: string;
  element: string;
  keyword: string;
  keywords: string[];
  color: string;
}

// Arquétipos traduzidos para EN, PT, ES (Padrão: EN)
export const NUMBER_ARCHETYPES_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, Omit<ArchetypeData, 'keywords'>>> = {
  en: {
    1: { title: 'The Leader', element: 'Fire', keyword: 'Independence, Courage, Creation', color: '#ef4444' },
    2: { title: 'The Diplomat', element: 'Water', keyword: 'Sensitivity, Cooperation, Harmony', color: '#06b6d4' },
    3: { title: 'The Communicator', element: 'Air', keyword: 'Expression, Enthusiasm, Creativity', color: '#f59e0b' },
    4: { title: 'The Builder', element: 'Earth', keyword: 'Discipline, Order, Solidity', color: '#10b981' },
    5: { title: 'The Explorer', element: 'Air/Fire', keyword: 'Freedom, Adventure, Transformation', color: '#8b5cf6' },
    6: { title: 'The Harmonizer', element: 'Earth/Water', keyword: 'Love, Family, Responsibility', color: '#ec4899' },
    7: { title: 'The Seeker', element: 'Water/Spirit', keyword: 'Intuition, Analysis, Inner Wisdom', color: '#6366f1' },
    8: { title: 'The Sovereign', element: 'Earth/Fire', keyword: 'Power, Prosperity, Material Mastery', color: '#d97706' },
    9: { title: 'The Humanitarian', element: 'Fire/Ether', keyword: 'Compassion, Universal Wisdom, Completion', color: '#14b8a6' },
    11: { title: 'The Illuminator', element: 'Divine Light', keyword: 'Supreme Intuition, Spiritual Vision, Channel', color: '#a855f7' },
    22: { title: 'The Master Builder', element: 'Cosmos', keyword: 'Global Construction, Manifesting Giant Dreams', color: '#eab308' },
    33: { title: 'The Master Teacher', element: 'Universal Love', keyword: 'Spiritual Healing, Collective Elevation, Compassion', color: '#38bdf8' },
  },
  pt: {
    1: { title: 'O Líder', element: 'Fogo', keyword: 'Independência, Coragem, Criação', color: '#ef4444' },
    2: { title: 'O Diplomata', element: 'Água', keyword: 'Sensibilidade, Cooperação, Harmonia', color: '#06b6d4' },
    3: { title: 'O Comunicador', element: 'Ar', keyword: 'Expressão, Entusiasmo, Criatividade', color: '#f59e0b' },
    4: { title: 'O Construtor', element: 'Terra', keyword: 'Disciplina, Ordem, Solidez', color: '#10b981' },
    5: { title: 'O Explorador', element: 'Ar/Fogo', keyword: 'Liberdade, Aventura, Mudança', color: '#8b5cf6' },
    6: { title: 'O Pacificador', element: 'Terra/Água', keyword: 'Amor, Família, Responsabilidade', color: '#ec4899' },
    7: { title: 'O Buscador', element: 'Água/Espírito', keyword: 'Intuição, Análise, Conexão Divina', color: '#6366f1' },
    8: { title: 'O Soberano', element: 'Terra/Fogo', keyword: 'Poder, Prosperidade, Conquista Material', color: '#d97706' },
    9: { title: 'O Humanitário', element: 'Fogo/Éter', keyword: 'Compaixão, Sabedoria Universal, Conclusão', color: '#14b8a6' },
    11: { title: 'O Iluminador', element: 'Luz Divina', keyword: 'Intuição Suprema, Visão Espiritual, Canalizador', color: '#a855f7' },
    22: { title: 'O Mestre Arquiteto', element: 'Cosmos', keyword: 'Construção Global, Materialização de Sonhos Gigantes', color: '#eab308' },
    33: { title: 'O Mestre Avatar', element: 'Amor Universal', keyword: 'Cura Espiritual, Elevação Coletiva, Compaixão Crística', color: '#38bdf8' },
  },
  es: {
    1: { title: 'El Líder', element: 'Fuego', keyword: 'Independencia, Coraje, Creación', color: '#ef4444' },
    2: { title: 'El Diplomático', element: 'Agua', keyword: 'Sensibilidad, Cooperación, Armonía', color: '#06b6d4' },
    3: { title: 'El Comunicador', element: 'Aire', keyword: 'Expresión, Entusiasmo, Creatividad', color: '#f59e0b' },
    4: { title: 'El Constructor', element: 'Tierra', keyword: 'Disciplina, Orden, Solidez', color: '#10b981' },
    5: { title: 'El Explorador', element: 'Aire/Fuego', keyword: 'Libertad, Aventura, Transformación', color: '#8b5cf6' },
    6: { title: 'El Pacificador', element: 'Tierra/Agua', keyword: 'Amor, Familia, Responsabilidad', color: '#ec4899' },
    7: { title: 'El Buscador', element: 'Agua/Espíritu', keyword: 'Intuición, Análisis, Sabiduría Interior', color: '#6366f1' },
    8: { title: 'El Soberano', element: 'Tierra/Fuego', keyword: 'Poder, Prosperidad, Conquista Material', color: '#d97706' },
    9: { title: 'El Humanitario', element: 'Fuego/Éter', keyword: 'Compasión, Sabiduría Universal, Culminación', color: '#14b8a6' },
    11: { title: 'El Iluminador', element: 'Luz Divina', keyword: 'Intuición Suprema, Visión Espiritual, Canalizador', color: '#a855f7' },
    22: { title: 'El Maestro Constructor', element: 'Cosmos', keyword: 'Construcción Global, Materialización de Grandes Sueños', color: '#eab308' },
    33: { title: 'El Maestro Avatar', element: 'Amor Universal', keyword: 'Sanación Espiritual, Elevación Colectiva, Compasión', color: '#38bdf8' },
  },
};

// Export padrão com suporte retrocompatível
export const NUMBER_ARCHETYPES: Record<number, ArchetypeData> = Object.fromEntries(
  Object.entries(NUMBER_ARCHETYPES_BY_LANG.en).map(([k, v]) => [k, { ...v, keywords: v.keyword.split(', ') }])
);

export function getArchetype(num: number, lang: 'en' | 'pt' | 'es' = 'en'): ArchetypeData {
  const dict = NUMBER_ARCHETYPES_BY_LANG[lang] || NUMBER_ARCHETYPES_BY_LANG.en;
  const item = dict[num] || dict[1]!;
  return {
    ...item,
    keywords: item.keyword.split(', '),
  };
}

// Ditames da Alma Únicos por Número (1-9, 11, 22, 33) nos 3 idiomas
export const SOUL_DICTUMS_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, string>> = {
  en: {
    1: 'You originate the flame; do not fear walking the solitary frontier where creation begins.',
    2: 'Your power lies in quiet receptivity; true strength listens before the world speaks.',
    3: 'Give form to the unspoken word; authentic beauty is your most revolutionary act.',
    4: 'Erect an unshakeable temple within; discipline is the sacred vessel of freedom.',
    5: 'Transmute the winds of change into wings; liberty is your eternal compass.',
    6: 'Heal without possessing; genuine love expands the horizon of all it touches.',
    7: 'Step into the lucid silence; the wisdom you seek was never outside your own depth.',
    8: 'Command without tyranny; spiritual mastery and material abundance are one current.',
    9: 'Release the ephemeral to grasp the universal; your compassion dissolves all boundaries.',
    11: 'Anchor the celestial beacon; your intuition sees through the veil of mortal illusion.',
    22: 'Build what outlives generations; turn cosmic vision into earthly monuments.',
    33: 'Radiate unconditional solace; true mastery is the selfless elevation of human souls.',
  },
  pt: {
    1: 'Você inaugura a chama primordial; não tema caminhar na fronteira solitária onde tudo se cria.',
    2: 'Seu poder reside na receptividade sutil; a verdadeira força sabe escutar antes do mundo falar.',
    3: 'Dê contorno à palavra não dita; a beleza autêntica é o seu ato mais revolucionário.',
    4: 'Edifique um templo inabalável por dentro; a disciplina é o vaso sagrado da liberdade.',
    5: 'Transmute os ventos do imprevisto em asas; a liberdade é a sua bússola imutável.',
    6: 'Acolha sem aprisionar; o amor maduro expande os horizontes de tudo o que toca.',
    7: 'Mergulhe no silêncio lúcido; a verdade que você persegue sempre habitou em sua profundeza.',
    8: 'Governe sem tirania; a maestria espiritual e o poder material formam a mesma corrente.',
    9: 'Desapegue do efêmero para tocar o universal; sua compaixão dissolve todas as fronteiras.',
    11: 'Ancore o farol celestial na terra; sua intuição lúcida desfaz as ilusões do mundo ordinário.',
    22: 'Construa aquilo que desafia os séculos; transforme visões universais em monumentos tangíveis.',
    33: 'Irradie alívio e compaixão incondicional; a maestria suprema é elevar a alma dos que cruzam seu caminho.',
  },
  es: {
    1: 'Tú enciendes el fuego primordial; no temas caminar en la frontera solitaria donde todo nace.',
    2: 'Tu poder reside en la escucha sutil; la verdadera fuerza comprende antes de que el mundo hable.',
    3: 'Da forma a la palabra no dicha; la belleza auténtica es tu acto más revolucionario.',
    4: 'Construye un templo inquebrantable en tu interior; la disciplina es el cáliz de la libertad.',
    5: 'Transforma los vientos del cambio en alas; la libertad lúcida es tu brújula eterna.',
    6: 'Acoge sin aprisionar; el amor verdadero expande el horizonte de todo lo que roza.',
    7: 'Adéntrate en el silencio lúcido; la sabiduría que buscas siempre latió en tu propia profundidad.',
    8: 'Gobierna sin tiranía; la maestria espiritual y la abundancia material son una misma corriente.',
    9: 'Suelta lo efímero para abrazar lo universal; tu compasión trasciende cualquier frontera.',
    11: 'Ancla el faro divino en la tierra; tu intuición penetra el velo de cualquier ilusión.',
    22: 'Edifica lo que perdura a través de los siglos; convierte sueños titánicos en realidades tangibles.',
    33: 'Irradia consuelo incondicional; la maestría más alta es la elevación desinteresada de las almas.',
  },
};

export function getSoulDictum(num: number, lang: 'en' | 'pt' | 'es' = 'en'): string {
  const dict = SOUL_DICTUMS_BY_LANG[lang] || SOUL_DICTUMS_BY_LANG.en;
  return dict[num] || dict[1]!;
}

// Re-exportações das interpretações aprofundadas dos pilares (1-9, 11, 22, 33)
export { getSoulUrgeDeep, SOUL_URGE_INTERPRETATIONS as SOUL_URGE_DEEP_BY_LANG } from './interpretations/soulUrge';
export { getPersonalityDeep, PERSONALITY_INTERPRETATIONS as PERSONALITY_DEEP_BY_LANG } from './interpretations/personality';
export { getBirthdayDeep, BIRTHDAY_INTERPRETATIONS as BIRTHDAY_DEEP_BY_LANG } from './interpretations/birthday';
export { getMaturityDeep, MATURITY_INTERPRETATIONS as MATURITY_DEEP_BY_LANG } from './interpretations/maturity';
export * from './interpretations';
