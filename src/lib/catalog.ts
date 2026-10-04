export const CATALOG = {
  map: { name: "Mapa Numerológico", price: 1990 },
  synastry: { name: "Minha primeira sinastria", price: 990, description: "Uma comparação completa entre o seu mapa e o do seu crush: afinidades, necessidades afetivas, diferenças e formas de se conectar em cinco dimensões. Preencha os dados abaixo e receba a sinastria pronta junto do seu mapa, para reler quando quiser." },
  synastry_credit: { name: "Crédito de Sinastria", price: 1490, description: "Uma nova comparação entre seu mapa e o de outra pessoa, com leitura dos vínculos, diferenças e propostas de conversa." },
  calendar: { name: "Calendário Pessoal de 12 Meses", price: 990, description: "Veja o número de cada um dos próximos 12 meses, com interpretação e uma proposta de reflexão para cada fase." },
  name: { name: "Forças do Nome", price: 790, description: "Descubra os números que mais aparecem no seu nome e os que estão ausentes, com leituras de potenciais e aprendizados." },
  challenges: { name: "Seus Quatro Desafios", price: 990, description: "Conheça os quatro desafios calculados pela sua data de nascimento e exercícios para observar esses temas na sua vida." },
  atlas: { name: "Atlas dos Ciclos de Vida", price: 2990, description: "Uma leitura das grandes fases da sua trajetória: quatro pináculos, suas faixas de idade, o ciclo atual e um roteiro de reflexão." },
} as const;
export const BUMP_IDS = ["calendar", "name", "challenges", "synastry"] as const;
export type BumpId = typeof BUMP_IDS[number];
export type ProductId = "map" | "atlas" | "synastry_credit";
export type Order = { product: ProductId; bumps: BumpId[]; amountCents: number };
export const brl = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

/** Both browser and server use the catalog; prices from a request are never trusted. */
export function createOrder(product: unknown = "map", bumps: unknown = []): Order {
  if (product !== "map" && product !== "atlas" && product !== "synastry_credit") throw new Error("Produto inválido.");
  if (!Array.isArray(bumps) || bumps.some(id => !BUMP_IDS.includes(id)) || new Set(bumps).size !== bumps.length) throw new Error("Adicionais inválidos.");
  if (product !== "map" && bumps.length) throw new Error("Este produto não possui adicionais.");
  const selected = BUMP_IDS.filter(id => bumps.includes(id));
  return { product, bumps: selected, amountCents: CATALOG[product].price + selected.reduce((sum, id) => sum + CATALOG[id].price, 0) };
}

export function validateCustomer(input: { name?: unknown; email?: unknown; birthDate?: unknown }, today: string) {
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  let birthDate = typeof input.birthDate === "string" ? input.birthDate : "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) birthDate = birthDate.split("/").reverse().join("-");
  if (name.length > 150 || !/^[\p{L}\p{M}'’ -]+$/u.test(name) || name.split(" ").filter(part => /\p{L}{2}/u.test(part)).length < 2) throw new Error("Informe seu nome completo de nascimento.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido para receber seu acesso.");
  const date = new Date(`${birthDate}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate || birthDate < "1900-01-01" || birthDate > today) throw new Error("Confira sua data de nascimento.");
  return { name, email, birthDate };
}

export function validateSynastryPerson(input: unknown, today: string) {
  if (!input || typeof input !== "object") throw new Error("Preencha o nome completo e a data de nascimento do seu crush para incluir a sinastria.");
  const candidate = input as { name?: unknown; birthDate?: unknown };
  try {
    const { name, birthDate } = validateCustomer({ name: candidate.name, birthDate: candidate.birthDate, email: "profile@example.invalid" }, today);
    return { name, birthDate };
  } catch { throw new Error("Confira o nome completo de nascimento e a data válida do seu crush."); }
}
