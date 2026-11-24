import InputForm from "@/components/form/InputForm";
import { MARKETS, marketOptions } from "@/lib/markets";

const FEATURES = [
  { k: "01", t: "Micro-market verdict", d: "Which locality fits your goal and budget, with pros & cons side by side." },
  { k: "02", t: "Yield & cashflow math", d: "Gross and net yield, stamp duty, and a 5-year EMI vs rent simulation." },
  { k: "03", t: "Infra catalyst score", d: "Metro, expressway and airport timelines, adjusted for realistic slippage." },
  { k: "04", t: "Red-flag checklist", d: "RERA checkpoints, water and traffic bottlenecks, oversupply and negotiation tips." },
];

export default function Home() {
  return (
    <div className="relative">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />
      <section className="grid items-start gap-10 pt-12 lg:grid-cols-[1fr_520px] lg:pt-20">
        <div>
          <p className="num inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {MARKETS.length} micro-markets · 5 metros
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Know the yield <span className="text-accent">before</span> you sign the agreement.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            PropPulse AI compares Indian micro-markets head-to-head — rents, yields, EMIs and upcoming infrastructure —
            grounded in a market dataset rather than guesses.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.k} className="rounded-xl border border-line bg-panel/70 p-4">
                <p className="num text-xs text-accent">{f.k}</p>
                <p className="mt-1 font-medium">{f.t}</p>
                <p className="mt-1 text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
        <InputForm options={marketOptions()} />
      </section>
    </div>
  );
}
