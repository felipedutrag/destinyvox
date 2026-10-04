import { calculateFullNumerology, calculatePersonalYear, reduceStrictSingleDigit } from "../utils/numerology";
import { brazilianDate } from "./web-map";

export type Person = { name: string; birthDate: string };
export type RelationshipTheme = { title: string; need: string; tension: string; invitation: string };
const THEMES: Record<number, RelationshipTheme> = {
  0: { title: "Leitura em aberto", need: "revisar a grafia do nome, pois não há letras suficientes nesta categoria", tension: "atribuir um significado a um cálculo sem base suficiente", invitation: "Confiram o nome completo de nascimento antes de interpretar este eixo." },
  1: { title: "Autonomia", need: "ter iniciativa e espaço para escolhas próprias", tension: "decidir pelo casal sem consultar a outra pessoa", invitation: "Que decisão é individual e qual precisa ser construída a dois?" },
  2: { title: "Reciprocidade", need: "sentir escuta, acolhimento e participação", tension: "esperar que o outro adivinhe o que você precisa", invitation: "Como podemos pedir carinho de uma forma concreta?" },
  3: { title: "Expressão", need: "compartilhar ideias, afeto e momentos leves", tension: "usar humor para evitar uma conversa difícil", invitation: "Qual assunto merece uma conversa sem distrações nesta semana?" },
  4: { title: "Constância", need: "ter acordos claros e uma rotina confiável", tension: "transformar combinados em regras que não podem ser revistas", invitation: "Qual pequeno combinado tornaria nossa rotina mais tranquila?" },
  5: { title: "Liberdade", need: "explorar novidades e preservar espaço pessoal", tension: "confundir compromisso com perda de liberdade", invitation: "Como cuidar do vínculo e continuar tendo experiências individuais?" },
  6: { title: "Cuidado", need: "construir pertencimento e dividir responsabilidades", tension: "assumir tudo e depois cobrar reconhecimento", invitation: "O que cada um pode assumir para que o cuidado seja recíproco?" },
  7: { title: "Profundidade", need: "ter tempo para elaborar sentimentos e conversar com calma", tension: "se recolher sem explicar quando pretende retomar o contato", invitation: "Como pedir uma pausa sem deixar a outra pessoa sem resposta?" },
  8: { title: "Construção", need: "alinhar planos, recursos e prioridades", tension: "tratar uma conversa afetiva como uma disputa por resultados", invitation: "O que significa construir uma vida boa para cada um de nós?" },
  9: { title: "Generosidade", need: "encontrar sentido no vínculo e compartilhar valores", tension: "idealizar a relação ou se responsabilizar por resolver tudo", invitation: "O que podemos oferecer sem ultrapassar nossos próprios limites?" },
  11: { title: "Sensibilidade", need: "dar palavras às percepções e receber escuta cuidadosa", tension: "tomar uma impressão como certeza sobre o que o outro sente", invitation: "O que eu observei de fato e o que preciso perguntar?" },
  22: { title: "Projeto em comum", need: "transformar uma visão compartilhada em passos possíveis", tension: "dar mais atenção aos planos do que à presença cotidiana", invitation: "Qual passo cabe na nossa vida hoje e qual pode esperar?" },
  33: { title: "Cuidado com limites", need: "apoiar o crescimento do outro sem abandonar o próprio", tension: "virar responsável pelo bem-estar e pelas escolhas da outra pessoa", invitation: "Como posso apoiar você sem decidir por você?" },
};
export function relationshipTheme(value: number) { return THEMES[value] || THEMES[0]; }
export type SynastryDimension = {
  id: string; title: string; a: number; b: number; connection: number | null;
  calculation: string; readingA: string; readingB: string; affinity: string; friction: string; practice: string;
};
export type SynastryReport = { version: 1; referenceDate: string; a: Person; b: Person; dimensions: SynastryDimension[] };

// Editorial convention: original numbers retain masters; the shared theme is
// reduced to 1–9. It describes a conversation topic, never a success probability.
export function buildSynastry(a: Person, b: Person, referenceDate = brazilianDate()): SynastryReport {
  const pa = calculateFullNumerology(a.name, a.birthDate), pb = calculateFullNumerology(b.name, b.birthDate);
  const year = Number(referenceDate.slice(0, 4));
  const axes = [
    ["path", "Direção de vida", pa.lifePath, pb.lifePath, "Redução da data de nascimento de cada pessoa, preservando 11, 22 e 33.", "Escolham um plano em comum e um projeto individual que desejam apoiar."],
    ["soul", "Necessidades afetivas", pa.soulUrge, pb.soulUrge, "Soma dos valores das vogais do nome completo de nascimento de cada pessoa.", "Cada pessoa completa: eu me sinto acolhida quando… Depois, combinem um gesto possível."],
    ["expression", "Como vocês se expressam", pa.expression, pb.expression, "Soma pitagórica de todas as letras do nome de nascimento de cada pessoa.", "Cada pessoa fala por dois minutos; a outra resume o que entendeu antes de responder."],
    ["personality", "O que chega ao outro", pa.personality, pb.personality, "Soma dos valores das consoantes do nome de nascimento de cada pessoa.", "Conversem sobre uma diferença entre o que demonstram e o que sentem por dentro."],
    ["year", `Ritmos de ${year}`, calculatePersonalYear(a.birthDate, year), calculatePersonalYear(b.birthDate, year), `Dia e mês de cada nascimento somados a ${year}, com redução de 1 a 9.`, "Escolham uma prioridade para este ano e um limite de tempo ou energia a respeitar."],
  ] as const;
  const dimensions = axes.map(([id, title, va, vb, formula, practice]): SynastryDimension => {
    const ta = relationshipTheme(va), tb = relationshipTheme(vb);
    const connection = va && vb ? reduceStrictSingleDigit(va + vb) : null;
    const sameBase = va && vb && reduceStrictSingleDigit(va) === reduceStrictSingleDigit(vb);
    return {
      id, title, a: va, b: vb, connection,
      calculation: `${formula} Tema do encontro: ${va} + ${vb} = ${va + vb}${connection === null ? ". Não interpretamos uma soma com valor ausente." : ` → ${connection}. Na soma do encontro, reduzimos inclusive os mestres a um dígito.`}`,
      readingA: `${a.name.split(" ")[0]} · ${ta.title}: um convite a observar a necessidade de ${ta.need}.`,
      readingB: `${b.name.split(" ")[0]} · ${tb.title}: um convite a observar a necessidade de ${tb.need}.`,
      affinity: connection === null ? "Este eixo precisa de revisão dos dados; as outras dimensões continuam disponíveis." : sameBase ? `Vocês compartilham a base ${reduceStrictSingleDigit(va)} neste eixo. A familiaridade com ${relationshipTheme(reduceStrictSingleDigit(va)).title.toLowerCase()} pode facilitar o reconhecimento das necessidades do outro. Semelhança não significa que vocês vivam isso da mesma forma.` : `Este encontro coloca ${ta.title.toLowerCase()} e ${tb.title.toLowerCase()} em diálogo. Há espaço para ampliar o repertório: ${a.name.split(" ")[0]} pode explicar a importância de ${ta.need}, enquanto ${b.name.split(" ")[0]} mostra o valor de ${tb.need}.`,
      friction: sameBase ? `Um ponto para observar juntos é ${ta.tension}. Quando ambos esperam a mesma coisa, vale combinar quem toma a iniciativa e como o cuidado circula.` : `Observem dois riscos distintos: ${ta.tension} e ${tb.tension}. Em uma conversa real, perguntem sobre a intenção antes de concluir que a diferença significa desinteresse.`,
      practice: `${practice}${connection === null ? "" : ` Tema compartilhado ${connection} · ${relationshipTheme(connection).title}: ${relationshipTheme(connection).invitation}`}`,
    };
  });
  return { version: 1, referenceDate, a, b, dimensions };
}
