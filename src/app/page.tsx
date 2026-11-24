import InputForm from "@/components/form/InputForm";
import { MARKETS, marketOptions } from "@/lib/markets";
import { CITIES } from "@/types";

const STEPS = [
  { k: "01", t: "Pick 2–3 localities", d: "Choose a city, the micro-markets on your shortlist, your budget, property type and goal." },
  { k: "02", t: "Get a free verdict", d: "See which locality fits your goal best, with pros & cons and estimated rent and yield side by side." },
  { k: "03", t: "Unlock the deep-dive", d: "For ₹499: stamp duty, net yield, a 5-year EMI vs rent simulation, infra timelines and a red-flag checklist." },
];

const LENSES = [
  { t: "Yield lens", d: "Gross and net rental yield after maintenance, tax, vacancy and duties." },
  { t: "Cost lens", d: "Price per sq.ft., stamp duty and registration at state rates, EMI at your loan %." },
  { t: "Future lens", d: "Metro, expressway and airport catalysts, with realistic slippage on official dates." },
  { t: "Risk lens", d: "RERA checkpoints, water and traffic bottlenecks, oversupply and negotiation tips." },
];

export default function Home() {
  const byCity = CITIES.map((c) => ({ city: c, locs: MARKETS.filter((m) => m.city === c) }));

  return (
    <div className="relative">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />

      {/* Hero + form */}
      <section id="compare" className="grid scroll-mt-20 items-start gap-10 pt-12 lg:grid-cols-[1fr_520px] lg:pt-20">
        <div>
          <p className="num inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {MARKETS.length} localities · {CITIES.length} metros
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Put your shortlist of localities <span className="text-accent">under the lens.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            Whitefield or Sarjapur Road? Dwarka Expressway or Noida Sector 150? LocalityLens compares Indian micro-markets
            side by side on rent, yield, EMI and upcoming infrastructure, so you can buy or invest with numbers, not hearsay.
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {[
              { v: "Free", l: "verdict & yield summary" },
              { v: "₹499", l: "full deep-dive report" },
              { v: "<1 min", l: "to your comparison" },
            ].map((s) => (
              <div key={s.l} className="bg-panel/90 p-4">
                <dt className="num text-xl font-semibold text-accent">{s.v}</dt>
                <dd className="mt-1 text-xs text-muted">{s.l}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {LENSES.map((f) => (
              <div key={f.t} className="rounded-xl border border-line bg-panel/70 p-4">
                <p className="font-medium">{f.t}</p>
                <p className="mt-1 text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
        <InputForm options={marketOptions()} />
      </section>

      {/* How it works */}
      <section id="how" className="mt-24 scroll-mt-20">
        <p className="num text-[11px] uppercase tracking-[0.2em] text-accent">How it works</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">From shortlist to decision in three steps</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.k} className="rounded-xl border border-line bg-panel/80 p-5">
              <p className="num text-sm text-accent">{s.k}</p>
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-xs text-muted">
          Every number comes from our locality dataset and a transparent finance model. The AI only writes the commentary,
          and it is instructed to stick to those figures.
        </p>
      </section>

      {/* Coverage */}
      <section id="coverage" className="mt-24 scroll-mt-20">
        <p className="num text-[11px] uppercase tracking-[0.2em] text-accent">Coverage</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Localities we cover today</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {byCity.map(({ city, locs }) => (
            <div key={city} className="rounded-xl border border-line bg-panel/80 p-4">
              <p className="font-semibold">{city}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {locs.map((m) => (
                  <li key={m.slug} className="flex items-baseline justify-between gap-2">
                    <span>{m.locality.replace(/ \(.*\)$/, "")}</span>
                    <span className="num text-[11px] text-accent/80">{m.gross_rental_yield_pct.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Indicative gross 2BHK yields from approximate seed data. More localities coming soon.</p>
      </section>
    </div>
  );
}
