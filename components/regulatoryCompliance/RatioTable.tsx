import type { CapitalRatioRow } from "@/lib/regulatoryCompliance/capitalRatios";

export type RatioTableColumns = {
  quarter: string;
  cet1: string;
  target: string;
  goingConcern: string;
  goneConcern: string;
  tlac: string;
};

type Props = {
  caption: string;
  columns: RatioTableColumns;
  rows: CapitalRatioRow[];
};

const VALUE_KEYS = ["cet1", "target", "goingConcern", "goneConcern", "tlac"] as const;

function formatValue(value: number | null): string {
  return value === null ? "–" : value.toFixed(2);
}

export function RatioTable({ caption, columns, rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-border/70 bg-surface/70 shadow-lg dark:border-border/40">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-text">
        <caption className="px-6 py-4 text-left text-sm font-semibold text-text">{caption}</caption>
        <thead>
          <tr className="border-y border-border/70 text-xs font-semibold uppercase tracking-wide text-muted dark:border-border/40">
            <th scope="col" className="px-6 py-3 font-semibold">
              {columns.quarter}
            </th>
            {VALUE_KEYS.map((key) => (
              <th key={key} scope="col" className="px-6 py-3 font-semibold">
                {columns[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.quarter} className="border-b border-border/60 last:border-none">
              <th scope="row" className="px-6 py-3 font-medium">
                {row.quarter}
              </th>
              {VALUE_KEYS.map((key) => (
                <td key={key} className="px-6 py-3 tabular-nums">
                  {formatValue(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
