"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, GOAL_LABELS, GOALS, PROPERTY_TYPES, type City, type Goal, type PropertyType } from "@/types";
import { formatINR } from "@/lib/format";

interface Option {
  city: City;
  slug: string;
  locality: string;
}

const BUDGET_PRESETS = [5_000_000, 10_000_000, 15_000_000, 25_000_000, 40_000_000];

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{children}</span>
      {hint ? <span className="text-[11px] text-muted/70">{hint}</span> : null}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label = (v) => v,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: (v: T) => string;
}) {
  return (
    <div className="grid gap-1 rounded-lg border border-line bg-panel-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md px-2 py-2 text-sm transition ${
            value === o ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export default function InputForm({ options }: { options: Option[] }) {
  const router = useRouter();
  const [city, setCity] = useState<City>("Bengaluru");
  const [localities, setLocalities] = useState<string[]>(["whitefield", "sarjapur-road"]);
  const [budgetCr, setBudgetCr] = useState("1.5");
  const [propertyType, setPropertyType] = useState<PropertyType>("2BHK");
  const [goal, setGoal] = useState<Goal>("rental_yield");
  const [loanPct, setLoanPct] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityOptions = useMemo(() => options.filter((o) => o.city === city), [options, city]);
  const budget = Math.round(parseFloat(budgetCr || "0") * 1e7);

  function pickCity(c: City) {
    setCity(c);
    setLocalities(options.filter((o) => o.city === c).slice(0, 2).map((o) => o.slug));
  }

  function toggle(slug: string) {
    setLocalities((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 3 ? cur : [...cur, slug],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (localities.length < 2) return setError("Pick at least 2 micro-markets to compare.");
    if (!budget || budget < 1_000_000) return setError("Enter a budget of at least ₹10 L.");
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          localities,
          budget_inr: budget,
          property_type: propertyType,
          goal,
          loan_pct: loanPct === "" ? null : Number(loanPct),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/report/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const vs = localities.map((s) => options.find((o) => o.slug === s)?.locality).filter(Boolean).join("  vs  ");

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-line bg-panel/90 p-5 shadow-2xl shadow-black/40 sm:p-6">
      <div>
        <Label>City</Label>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickCity(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                city === c ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:border-muted hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label hint={`${localities.length}/3 selected`}>Micro-markets to compare</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {cityOptions.map((o) => {
            const on = localities.includes(o.slug);
            const disabled = !on && localities.length >= 3;
            return (
              <button
                key={o.slug}
                type="button"
                disabled={disabled}
                onClick={() => toggle(o.slug)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  on ? "border-accent bg-accent/10 text-ink" : "border-line text-muted hover:border-muted hover:text-ink"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span>{o.locality}</span>
                <span className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
        {vs ? <p className="num mt-2 truncate text-xs text-accent/80">{vs}</p> : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label hint={budget ? formatINR(budget) : undefined}>Budget (₹ Crore)</Label>
          <div className="flex items-center rounded-lg border border-line bg-panel-2 focus-within:border-accent">
            <span className="pl-3 text-muted">₹</span>
            <input
              inputMode="decimal"
              value={budgetCr}
              onChange={(e) => setBudgetCr(e.target.value.replace(/[^0-9.]/g, ""))}
              className="num w-full bg-transparent px-2 py-2.5 outline-none"
              aria-label="Budget in crore"
            />
            <span className="pr-3 text-sm text-muted">Cr</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BUDGET_PRESETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudgetCr(String(b / 1e7))}
                className="num rounded border border-line px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-accent"
              >
                {formatINR(b)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label hint="optional · default 75%">Home loan (% of value)</Label>
          <div className="flex items-center rounded-lg border border-line bg-panel-2 focus-within:border-accent">
            <input
              inputMode="numeric"
              placeholder="e.g. 80"
              value={loanPct}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setLoanPct(v === "" ? "" : String(Math.min(90, Number(v))));
              }}
              className="num w-full bg-transparent px-3 py-2.5 outline-none placeholder:text-muted/50"
              aria-label="Loan percentage"
            />
            <span className="pr-3 text-sm text-muted">%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label>Property type</Label>
          <Segmented options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
        </div>
        <div>
          <Label>Goal</Label>
          <Segmented options={GOALS} value={goal} onChange={setGoal} label={(g) => GOAL_LABELS[g]} />
        </div>
      </div>

      {error ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-70"
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
            Grounding analysis in market data…
          </>
        ) : (
          "Generate comparison report →"
        )}
      </button>
      <p className="text-center text-[11px] text-muted">Free verdict instantly · Full deep-dive ₹499</p>
    </form>
  );
}
