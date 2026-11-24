/** ₹1.52 Cr / ₹38.5 L / ₹32,000 */
export function formatINR(n: number, compact = true): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (compact && abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (compact && abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function formatPct(n: number | null, digits = 2): string {
  return n == null ? "—" : `${n.toFixed(digits)}%`;
}
