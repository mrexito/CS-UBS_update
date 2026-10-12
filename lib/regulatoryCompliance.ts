export const RC_BASE_PATH = "/regulatory-compliance";

export const RC_TOPICS = [
  { slug: "capital-ratios", key: "capitalRatios", hasContent: true },
  { slug: "liquidity", key: "liquidity", hasContent: false },
  { slug: "crisis-market-confidence", key: "crisis", hasContent: false },
  { slug: "regulatory-measures", key: "measures", hasContent: false },
  { slug: "at1-instruments", key: "at1", hasContent: false },
] as const;

export type RcTopic = (typeof RC_TOPICS)[number];

/** Anker-IDs der Abschnitte auf der Kapitel-7-Seite (Vertrag, nicht aendern). */
export const RC_CAPITAL_RATIOS_ANCHORS = {
  rwa: "rwa",
  leverage: "leverage",
} as const;
