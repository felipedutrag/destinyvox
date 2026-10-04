import { BUMP_IDS, CATALOG, type BumpId, type ProductId } from "./catalog";
import { buildWebMap, brazilianDate, type WebMap } from "./web-map";
import { calculateLifePath, calculatePersonalYear, calculatePersonalMonth, normalizeText, parseBirthDate, reduceStrictSingleDigit as strict, reduceToSingleDigitOrMaster as master } from "../utils/numerology";
import { MONTHLY_FORECAST_INTERPRETATIONS, interpolateFirstName } from "../utils/interpretations";

export type ProductEntry = { title: string; number: string; calculation: string; paragraphs: string[]; practice: string; current?: boolean };
export type ProductModule = { id: string; title: string; intro: string; entries: ProductEntry[] };
export type Purchase = { product: ProductId; bumps: BumpId[]; referenceDate: string };

// Original editorial interpretations. These are symbolic prompts, not predictions.
const THEMES: Record<number, [string, string, string]> = {
  0: ["Possibilidades abertas", "Em vez de concentrar a leitura em um único tema, o zero convida a perceber qual aprendizado pede atenção em cada contexto. Isso não significa ausência de dificuldades: o ponto é escolher conscientemente o que desenvolver.", "Escolha uma situação recente e escreva qual habilidade teria ajudado você a atravessá-la."],
  1: ["Autonomia", "O um coloca em pauta iniciativa e identidade. Observe onde você consegue sustentar suas escolhas e onde espera uma autorização que talvez não precise. A expressão equilibrada desse tema combina coragem para começar com abertura para escutar.", "Defina uma pequena decisão que você pode assumir e o primeiro passo para colocá-la em prática."],
  2: ["Cooperação", "O dois convida a olhar para escuta, vínculos e reciprocidade. Sensibilidade pode ajudar a perceber nuances, mas não precisa virar concordância automática. Reflita sobre como fazer acordos sem deixar suas próprias necessidades de fora.", "Escreva uma necessidade sua e uma forma clara e respeitosa de comunicá-la."],
  3: ["Expressão", "O três traz o tema da comunicação e da criatividade. Experimente dar forma ao que sente, sem exigir que a primeira tentativa seja perfeita. A reflexão está em transformar ideias em algo compartilhável e dar continuidade ao que desperta seu interesse.", "Reserve vinte minutos para escrever, criar ou conversar sobre uma ideia que você tem adiado."],
  4: ["Estrutura", "O quatro propõe olhar para rotina, consistência e limites. Uma estrutura útil apoia a vida que você deseja, sem se tornar rigidez. Observe se seu planejamento cabe no tempo e na energia que você realmente tem hoje.", "Escolha um hábito simples, defina quando praticá-lo e reveja o compromisso ao final de uma semana."],
  5: ["Mudança", "O cinco abre uma reflexão sobre liberdade e experimentação. Mudar pode ampliar repertórios, mas a novidade não precisa substituir tudo o que funciona. Pergunte-se se uma mudança vem da curiosidade ou da vontade de escapar de um desconforto.", "Teste uma alternativa pequena antes de decidir por uma mudança maior. Anote o que aprendeu."],
  6: ["Cuidado", "O seis coloca em foco responsabilidade e pertencimento. Cuidar pode fortalecer relações quando inclui limites e acordos. Observe a diferença entre oferecer apoio e assumir tarefas que não são suas, deixando espaço também para receber.", "Identifique uma responsabilidade que pode ser dividida e proponha um acordo concreto."],
  7: ["Profundidade", "O sete convida à investigação e ao espaço interior. Estudar e refletir podem trazer clareza, desde que não se tornem uma espera infinita pela certeza. Procure equilibrar tempo de recolhimento com a troca de experiências reais.", "Escolha uma pergunta relevante, busque uma fonte confiável e converse com alguém sobre o que descobriu."],
  8: ["Realização", "O oito coloca em pauta objetivos, recursos e responsabilidade pelas decisões. A proposta é observar como você define sucesso e quais custos aceita para buscá-lo. Resultados dependem de circunstâncias e ações concretas, não de um número.", "Escolha um objetivo, um indicador de progresso e um limite que você quer respeitar ao persegui-lo."],
  9: ["Conclusão", "O nove convida a olhar para encerramentos e para o sentido do que você oferece ao mundo. Concluir pode ser reconhecer o que teve valor e o que já cumpriu seu papel. Generosidade também pede limites para não virar obrigação de resolver tudo.", "Liste algo que deseja concluir, o que aprendeu com isso e um gesto possível de encerramento."],
  11: ["Sensibilidade e inspiração", "O onze combina o tema da inspiração com a cooperação do dois. Observe como traduzir percepções em palavras e ações compreensíveis, sem assumir que toda impressão é um fato. Pausas e conversas podem ajudar a dar contexto ao que você sente.", "Registre uma percepção e separe o que você observou do significado que atribuiu a ela."],
  22: ["Construção com propósito", "O vinte e dois combina visão ampla com a estrutura do quatro. A reflexão está em aproximar um projeto importante de passos sustentáveis. Projetos coletivos dependem de acordos e recursos: a ambição pode conviver com prazos realistas.", "Divida uma ideia maior em três etapas e identifique a ajuda necessária para a primeira."],
  33: ["Cuidado que ensina", "O trinta e três aproxima expressão e responsabilidade. Compartilhar experiência pode ser valioso quando há espaço para a autonomia do outro. Reflita sobre formas de contribuir sem transformar disponibilidade em cobrança sobre si.", "Escolha um conhecimento que pode compartilhar e estabeleça um limite saudável para essa contribuição."],
};

export function nameFrequencies(name: string) {
  const frequencies = Array.from({ length: 9 }, () => 0);
  for (const letter of normalizeText(name)) frequencies[(letter.charCodeAt(0) - 97) % 9]++;
  return frequencies;
}

export function challengeNumbers(birthDate: string) {
  const { day, month, year } = parseBirthDate(birthDate);
  const d = strict(day), m = strict(month), y = strict(year);
  const first = Math.abs(d - m), second = Math.abs(d - y);
  return [first, second, Math.abs(first - second), Math.abs(m - y)];
}

export function pinnacleNumbers(birthDate: string) {
  const { day, month, year } = parseBirthDate(birthDate);
  const d = master(day), m = master(month), y = master(year);
  const first = master(m + d), second = master(d + y);
  return [first, second, master(first + second), master(m + y)];
}

function entry(value: number, title: string, calculation: string, context: string): ProductEntry {
  const [theme, text, practice] = THEMES[value];
  return { title: `${title} · ${theme}`, number: String(value), calculation, paragraphs: [context, text], practice };
}

export function buildProductModules(name: string, birthDate: string, purchase: Purchase, today = brazilianDate()): ProductModule[] {
  const modules: ProductModule[] = [];
  const { day, month, year } = parseBirthDate(birthDate);
  const selected = new Set(purchase.bumps);
  if (selected.has("calendar")) {
    const [startYear, startMonth] = purchase.referenceDate.split("-").map(Number);
    modules.push({ id: "calendar", title: CATALOG.calendar.name, intro: "Seu calendário começa no mês da compra. Cada mês inclui seu cálculo, uma leitura e uma proposta de reflexão — sem prometer acontecimentos.", entries: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(startYear, startMonth - 1 + index, 1));
      const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1;
      const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
      const personalYear = calculatePersonalYear(birthDate, y), value = calculatePersonalMonth(personalYear, m);
      return { title: label, number: String(value), current: today.slice(0, 7) === `${y}-${String(m).padStart(2, "0")}`, calculation: `Ano Pessoal ${personalYear} + mês ${m} = ${personalYear + m} → ${value}.`, paragraphs: interpolateFirstName(MONTHLY_FORECAST_INTERPRETATIONS.pt[value](label), name).split(/\n\s*\n/).filter(Boolean), practice: THEMES[value][2] };
    }) });
  }
  if (selected.has("name")) {
    const frequencies = nameFrequencies(name), peak = Math.max(...frequencies);
    const dominant = frequencies.flatMap((count, index) => count === peak && peak > 0 ? [index + 1] : []);
    const missing = frequencies.flatMap((count, index) => count === 0 ? [index + 1] : []);
    modules.push({ id: "name", title: CATALOG.name.name, intro: `As letras do seu nome são convertidas pela tabela pitagórica (A/J/S = 1 até I/R = 9). Frequências de 1 a 9: ${frequencies.join(" · ")}. Todos os empates são considerados. Ausência numérica não é defeito nem diagnóstico.`, entries: [
      ...dominant.map(value => entry(value, "Força recorrente", `O valor ${value} aparece ${peak} vez(es) em seu nome, a maior frequência.`, "Na leitura simbólica, um valor recorrente sugere uma qualidade para você reconhecer e explorar. Considere também o que acontece quando essa qualidade ocupa espaço demais.")),
      ...missing.map(value => entry(value, "Tema para desenvolver", `Nenhuma letra do seu nome corresponde ao valor ${value}.`, "Na numerologia, os valores ausentes são usados como convites de aprendizado. Isso não significa que você não tenha essa habilidade; compare a proposta com suas próprias experiências.")),
      ...(!missing.length ? [{ title: "Todos os valores presentes", number: "1–9", calculation: "Cada valor de 1 a 9 aparece ao menos uma vez no nome.", paragraphs: ["Seu nome não apresenta valores ausentes nesta convenção. Isso não representa perfeição: apenas descreve a distribuição das letras.", "Use a leitura das forças recorrentes para escolher o que deseja desenvolver com mais intenção."], practice: "Escolha um tema com o qual você se identifica e registre uma situação em que o colocou em prática." }] : []),
    ] });
  }
  if (selected.has("challenges")) {
    const d = strict(day), m = strict(month), y = strict(year), values = challengeNumbers(birthDate);
    const formulas = [`|${d} − ${m}|`, `|${d} − ${y}|`, `|${values[0]} − ${values[1]}|`, `|${m} − ${y}|`];
    modules.push({ id: "challenges", title: CATALOG.challenges.name, intro: "Quatro diferenças calculadas entre dia, mês e ano reduzidos a um dígito. O terceiro é o desafio principal. São temas de reflexão, sem datas fixas ou previsões de dificuldades.", entries: values.map((value, index) => entry(value, index === 2 ? "Desafio principal" : `${index + 1}º desafio`, `${formulas[index]} = ${value}. Dia ${d}, mês ${m}, ano ${y}.`, "Leia este tema como uma habilidade a exercitar. Observe situações em que ele aparece, o que já funciona para você e uma resposta diferente que gostaria de experimentar.")) });
  }
  if (purchase.product === "atlas") {
    const lifePath = strict(calculateLifePath(birthDate)), firstEnd = 36 - lifePath;
    const starts = [0, firstEnd + 1, firstEnd + 10, firstEnd + 19];
    const ends = [firstEnd, firstEnd + 9, firstEnd + 18, Infinity];
    const [ty, tm, td] = today.split("-").map(Number);
    const age = ty - year - (tm < month || (tm === month && td < day) ? 1 : 0);
    const values = pinnacleNumbers(birthDate);
    const d = master(day), m = master(month), y = master(year);
    const formulas = [`${m} + ${d}`, `${d} + ${y}`, `${values[0]} + ${values[1]}`, `${m} + ${y}`];
    modules.push({ id: "atlas", title: CATALOG.atlas.name, intro: `Quatro grandes capítulos calculados a partir do nascimento. Nesta convenção, o primeiro termina aos 36 − ${lifePath} = ${firstEnd} anos; os dois seguintes duram nove anos. A última fase permanece aberta. A idade muda no aniversário; as faixas são simbólicas, não prazos para acontecimentos.`, entries: values.map((value, index) => ({
      ...entry(value, `${index + 1}º pináculo · ${Number.isFinite(ends[index]) ? `${starts[index]} a ${ends[index]} anos` : `a partir de ${starts[index]} anos`}`, `${formulas[index]} → ${value}. Preservamos 11, 22 e 33 nas somas.`, `${name.split(" ")[0]}, use este capítulo para ${age > ends[index] ? "revisitar experiências e reconhecer aprendizados" : age >= starts[index] ? "observar o momento atual e escolher o que quer desenvolver" : "imaginar quais qualidades gostaria de cultivar com o tempo"}. O número não determina como essa etapa deve acontecer.`),
      current: age >= starts[index] && age <= ends[index],
    })) });
  }
  return modules;
}

/** Old maps have no purchase payload and keep their original nine-number access. */
export function readPurchase(value: unknown, fallbackDate = brazilianDate()): Purchase {
  const saved = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const bumps = Array.isArray(saved.bumps) ? saved.bumps : [];
  return { product: saved.product === "atlas" ? "atlas" : "map", bumps: BUMP_IDS.filter(id => bumps.includes(id)), referenceDate: typeof saved.referenceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.referenceDate) ? saved.referenceDate : fallbackDate };
}

export function buildPurchasedMap(name: string, birthDate: string, purchase: Purchase, today = brazilianDate()): WebMap {
  return { ...buildWebMap(name, birthDate, today), purchase, modules: buildProductModules(name, birthDate, purchase, today) };
}
