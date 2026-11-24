import type { PaidSection, ReportInput } from "@/types";
import { Badge, Card, SectionHeader, riskTone } from "@/components/ui/Card";
import { formatINR, formatPct } from "@/lib/format";
import CashflowChart from "./CashflowChart";

type Names = Record<string, string>;

export function FinancialTable({ paid, input }: { paid: PaidSection; input: ReportInput }) {
  const ms = paid.metrics;
  const rows: { label: string; render: (i: number) => React.ReactNode; hint?: string }[] = [
    { label: "Price / sq.ft.", render: (i) => formatINR(ms[i].price_sqft, false) },
    { label: input.property_type === "Plot" ? "Plot size (sq.ft.)" : "Typical size (sq.ft.)", render: (i) => ms[i].size_sqft.toLocaleString("en-IN") },
    { label: "Est. property price", render: (i) => formatINR(ms[i].est_price) },
    { label: "Stamp duty", render: (i) => `${formatINR(ms[i].stamp_duty)} (${ms[i].stamp_duty_rate_pct}%)`, hint: "approx. state rate" },
    { label: "Registration", render: (i) => formatINR(ms[i].registration) },
    { label: "Annual maintenance", render: (i) => formatINR(ms[i].annual_maintenance) },
    { label: "Gross rental yield", render: (i) => formatPct(ms[i].gross_yield_pct) },
    { label: "Net rental yield", render: (i) => formatPct(ms[i].net_yield_pct), hint: "after maintenance, tax, 1-mo vacancy, duties" },
    { label: "Loan amount", render: (i) => formatINR(ms[i].loan_amount) },
    { label: "Monthly EMI", render: (i) => formatINR(ms[i].emi_monthly, false), hint: `${ms[0].interest_rate_pct}% · ${ms[0].tenure_years} yrs` },
    { label: "Projected value (5 yrs)", render: (i) => formatINR(ms[i].projected_value_5y), hint: "half of trailing 5y CAGR" },
  ];
  return (
    <section>
      <SectionHeader kicker="Deep dive" title="Financial comparison" />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">Metric</th>
              {ms.map((m) => (
                <th key={m.slug} className="px-4 py-3 text-right font-medium">{m.locality}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5">
                  {r.label}
                  {r.hint ? <span className="block text-[11px] text-muted">{r.hint}</span> : null}
                </td>
                {ms.map((m, i) => (
                  <td key={m.slug} className="num px-4 py-2.5 text-right">{r.render(i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4 p-5">
        <CashflowChart metrics={ms} />
        <p className="mt-4 text-[11px] text-muted">
          Assumes rent and maintenance grow 5%/yr, EMI fixed. For self-use, read &ldquo;Rent&rdquo; as the rent you avoid paying.
          {input.loan_pct == null ? " Loan not specified, so 75% LTV is assumed." : ""}
        </p>
      </Card>
    </section>
  );
}

export function InfraScore({ paid, names }: { paid: PaidSection; names: Names }) {
  return (
    <section>
      <SectionHeader kicker="Catalysts" title="Infrastructure & future potential" />
      <div className={`grid gap-4 md:grid-cols-2 ${paid.infra_outlook.length === 3 ? "lg:grid-cols-3" : ""}`}>
        {paid.infra_outlook.map((o) => {
          const score = paid.metrics.find((m) => m.slug === o.slug)?.infra_score ?? 0;
          return (
            <Card key={o.slug} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{names[o.slug] ?? o.slug}</p>
                <div className="text-right">
                  <p className="num text-2xl font-semibold text-accent">{score}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">infra score</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{o.outlook}</p>
              <ul className="mt-4 space-y-3">
                {o.timelines.map((t) => {
                  const slip = t.realistic_year - t.official_year;
                  return (
                    <li key={t.project} className="rounded-lg border border-line bg-panel-2 p-3">
                      <p className="text-sm font-medium">{t.project}</p>
                      <div className="num mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted">Official {t.official_year}</span>
                        <span className="text-muted">→</span>
                        <span>Realistic {t.realistic_year}</span>
                        {slip > 0 ? <Badge tone="amber">+{slip} yr slip</Badge> : <Badge tone="green">On track</Badge>}
                      </div>
                      <p className="mt-1.5 text-xs text-muted">{t.note}</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function RiskChecklist({ paid, names }: { paid: PaidSection; names: Names }) {
  const order = { high: 0, medium: 1, low: 2 } as const;
  const risks = [...paid.risks].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div>
        <SectionHeader kicker="Due diligence" title="Risk & red-flag checklist" />
        <Card className="divide-y divide-line">
          {risks.map((r, i) => (
            <label key={i} className="flex cursor-pointer gap-3 p-4 text-sm hover:bg-panel-2/60">
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" />
              <span className="flex-1">
                <span className="mb-1 flex flex-wrap gap-1.5">
                  <Badge tone="blue">{r.category}</Badge>
                  <Badge tone={riskTone(r.severity)}>{r.severity === "high" ? "▲ " : ""}{r.severity} risk</Badge>
                  <Badge>{r.slug ? names[r.slug] ?? r.slug : "All localities"}</Badge>
                </span>
                {r.item}
              </span>
            </label>
          ))}
        </Card>
      </div>
      <div>
        <SectionHeader kicker="Deal desk" title="Negotiation tips" />
        <Card className="p-5">
          <ol className="space-y-3 text-sm">
            {paid.negotiation_tips.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="num text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}
