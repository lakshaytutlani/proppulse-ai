import type { FreeSection } from "@/types";
import { Badge, Card, SectionHeader } from "@/components/ui/Card";
import { formatINR, formatPct } from "@/lib/format";

type Names = Record<string, string>;

export function VerdictCard({ free, names }: { free: FreeSection; names: Names }) {
  const v = free.verdict;
  const sorted = [...v.fit_scores].sort((a, b) => b.score - a.score);
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-gradient-to-r from-accent/10 to-transparent p-5 sm:p-6">
        <p className="num text-[11px] uppercase tracking-[0.2em] text-accent">Verdict</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{v.headline}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{v.summary}</p>
      </div>
      <div className={`grid gap-px bg-line ${sorted.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {sorted.map((f) => {
          const win = f.slug === v.winner_slug;
          return (
            <div key={f.slug} className="bg-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{names[f.slug] ?? f.slug}</p>
                {win ? <Badge tone="green">Best fit</Badge> : null}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="num text-3xl font-semibold">{Math.round(f.score)}</span>
                <span className="text-xs text-muted">/100 fit</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-panel-2">
                <div className={`h-full rounded-full ${win ? "bg-accent" : "bg-muted/60"}`} style={{ width: `${Math.max(4, Math.min(100, f.score))}%` }} />
              </div>
              <p className="mt-3 text-xs text-muted">{f.one_liner}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ProsConsGrid({ free, names }: { free: FreeSection; names: Names }) {
  return (
    <section>
      <SectionHeader kicker="Compare" title="Pros & cons" />
      <div className={`grid gap-4 md:grid-cols-2 ${free.pros_cons.length === 3 ? "lg:grid-cols-3" : ""}`}>
        {free.pros_cons.map((pc) => (
          <Card key={pc.slug} className="p-5">
            <p className="font-semibold">{names[pc.slug] ?? pc.slug}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {pc.pros.map((p, i) => (
                <li key={`p${i}`} className="flex gap-2">
                  <span className="mt-0.5 text-accent" aria-label="Pro">＋</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="my-3 border-t border-dashed border-line" />
            <ul className="space-y-2 text-sm text-muted">
              {pc.cons.map((c, i) => (
                <li key={`c${i}`} className="flex gap-2">
                  <span className="mt-0.5 text-danger" aria-label="Con">－</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function RentYieldSummary({ free, propertyType }: { free: FreeSection; propertyType: string }) {
  return (
    <section>
      <SectionHeader kicker="Income" title={`Estimated rent & gross yield · ${propertyType}`} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">Micro-market</th>
              <th className="px-4 py-3 text-right font-medium">Est. price</th>
              <th className="px-4 py-3 text-right font-medium">Monthly rent</th>
              <th className="px-4 py-3 text-right font-medium">Gross yield</th>
              <th className="px-4 py-3 text-right font-medium">Budget fit</th>
            </tr>
          </thead>
          <tbody>
            {free.rent_summary.map((r) => (
              <tr key={r.slug} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium">{r.locality}</td>
                <td className="num px-4 py-3 text-right">{formatINR(r.est_price)}</td>
                <td className="num px-4 py-3 text-right">{r.monthly_rent ? formatINR(r.monthly_rent, false) : "n/a (plot)"}</td>
                <td className="num px-4 py-3 text-right text-accent">{formatPct(r.gross_yield_pct)}</td>
                <td className="px-4 py-3 text-right">
                  {r.within_budget ? <Badge tone="green">✓ Fits</Badge> : <Badge tone="amber">▲ Stretch</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
