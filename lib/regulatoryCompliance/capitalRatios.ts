/**
 * Kapitalquoten der Credit Suisse (Kapitel 7), Werte in %.
 * Zahlen sind sprachunabhaengig und deshalb nicht in den Messages abgelegt.
 * `null` bedeutet: Wert im Mockup nicht sichtbar / nicht vorhanden (Anzeige "–").
 */

export type CapitalRatioRow = {
  quarter: string;
  cet1: number | null;
  target: number | null;
  goingConcern: number | null;
  goneConcern: number | null;
  tlac: number | null;
};

export type CapitalRatioValueKey = Exclude<keyof CapitalRatioRow, "quarter">;

/** Tabelle 5 – CS Capital (RWA-based) Ratios in %, 2019–2023 (Auszug). */
export const RWA_CAPITAL_RATIOS: CapitalRatioRow[] = [
  { quarter: "Q1 2019", cet1: 12.53, target: 9.97, goingConcern: 17.35, goneConcern: 12.54, tlac: 29.89 },
  { quarter: "Q4 2022", cet1: 14.06, target: 9.6, goingConcern: 19.93, goneConcern: 19.57, tlac: 39.51 },
  { quarter: "Q1 2023", cet1: 20.26, target: 9.64, goingConcern: 20.26, goneConcern: 19.89, tlac: 40.15 },
  { quarter: "Q2 2023", cet1: 14.4, target: 10.6, goingConcern: 17.0, goneConcern: 16.0, tlac: 33.0 },
];

/**
 * Tabelle 6 – CS Leverage Ratios in %, 2019–2023 (Auszug).
 * Nur die im Mockup sichtbaren Werte; der Rest bleibt null.
 * Hinweis: Die Q4-2022-Zeile ist im Mockup abgeschnitten und wurde abgelesen (vor dem Merge pruefen).
 */
export const LEVERAGE_CAPITAL_RATIOS: CapitalRatioRow[] = [
  { quarter: "Q1 2019", cet1: 4.04, target: 3.2, goingConcern: 5.59, goneConcern: 4.04, tlac: 9.64 },
  { quarter: "Q4 2022", cet1: 5.42, target: 3.25, goingConcern: 7.69, goneConcern: 7.55, tlac: 15.24 },
  { quarter: "Q1 2023", cet1: 7.56, target: null, goingConcern: null, goneConcern: null, tlac: null },
  { quarter: "Q2 2023", cet1: null, target: null, goingConcern: null, goneConcern: null, tlac: null },
];
