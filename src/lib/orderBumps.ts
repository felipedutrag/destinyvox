export const ORDER_BUMPS = [
  {
    key: "karmicDebt",
    title: "Karmic Pattern Dossier",
    description: "Explore the traditional 13, 14, 16, and 19 themes, with personalized reflection prompts for working with the patterns in your chart.",
    stripeDescription: "A personalized numerology dossier exploring traditional karmic debt themes and reflection prompts.",
    priceUsd: 2.99,
    priceCents: 299,
  },
  {
    key: "personalYearMonths",
    title: "Your Year, Month by Month",
    description: "A personalized guide to the themes of all 12 months in your current Personal Year.",
    stripeDescription: "A personalized 12-month numerology guide for the customer's current Personal Year.",
    priceUsd: 2.99,
    priceCents: 299,
  },
  {
    key: "reflectionPlanner",
    title: "30-Day Reflection Planner",
    description: "One short daily prompt, personalized around your core numbers, to turn your reading into practical reflection.",
    stripeDescription: "A 30-day personalized numerology reflection planner with one daily prompt.",
    priceUsd: 2.99,
    priceCents: 299,
  },
] as const;

export type OrderBumpKey = (typeof ORDER_BUMPS)[number]["key"];

export type OrderBumpSelections = Record<OrderBumpKey, boolean>;

export const EMPTY_ORDER_BUMP_SELECTIONS: OrderBumpSelections = {
  karmicDebt: false,
  personalYearMonths: false,
  reflectionPlanner: false,
};

export function normalizeOrderBumpSelections(value: unknown): OrderBumpSelections {
  let selections = value;
  if (typeof selections === "string") {
    try {
      selections = JSON.parse(selections);
    } catch {
      selections = null;
    }
  }

  if (!selections || typeof selections !== "object" || Array.isArray(selections)) {
    return { ...EMPTY_ORDER_BUMP_SELECTIONS };
  }

  const source = selections as Record<string, unknown>;
  return {
    karmicDebt: source.karmicDebt === true,
    personalYearMonths: source.personalYearMonths === true,
    reflectionPlanner: source.reflectionPlanner === true,
  };
}

export function getOrderBumpTotalCents(selections: OrderBumpSelections) {
  return ORDER_BUMPS.reduce(
    (total, bump) => total + (selections[bump.key] ? bump.priceCents : 0),
    0,
  );
}
