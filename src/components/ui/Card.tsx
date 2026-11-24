import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-panel/90 ${className}`}>{children}</div>;
}

export function SectionHeader({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="num text-[11px] uppercase tracking-[0.2em] text-accent">{kicker}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

const TONES = {
  green: "border-accent/30 bg-accent/10 text-accent",
  amber: "border-warn/30 bg-warn/10 text-warn",
  red: "border-danger/30 bg-danger/10 text-danger",
  blue: "border-info/30 bg-info/10 text-info",
  gray: "border-line bg-panel-2 text-muted",
} as const;

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function riskTone(level: "low" | "medium" | "high") {
  return level === "high" ? "red" : level === "medium" ? "amber" : "green";
}
