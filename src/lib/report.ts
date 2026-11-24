import "server-only";
import type { FreeSection, PaidSection, PublicReport, ReportInput, ReportRecord } from "@/types";
import { computeMetrics } from "@/lib/finance";
import { getMarkets, MARKETS } from "@/lib/markets";
import { analyze } from "@/lib/analysis";

export async function generateReport(input: ReportInput): Promise<{ free: FreeSection; paid: PaidSection }> {
  const markets = getMarkets(input.localities);
  const metrics = markets.map((m) => computeMetrics(m, input));
  const analysis = await analyze(input, markets, metrics);

  const free: FreeSection = {
    verdict: analysis.verdict,
    pros_cons: analysis.pros_cons,
    rent_summary: metrics.map((x) => ({
      slug: x.slug,
      locality: x.locality,
      monthly_rent: x.monthly_rent,
      gross_yield_pct: x.gross_yield_pct,
      est_price: x.est_price,
      within_budget: x.within_budget,
    })),
    analysis_source: analysis.source,
  };
  const paid: PaidSection = {
    metrics,
    infra_outlook: analysis.infra_outlook,
    risks: analysis.risks,
    negotiation_tips: analysis.negotiation_tips,
  };
  return { free, paid };
}

/** Strip the paid section unless the report has been paid for. */
export function toPublic(r: ReportRecord): PublicReport {
  const localityNames = Object.fromEntries(
    MARKETS.filter((m) => r.input.localities.includes(m.slug)).map((m) => [m.slug, m.locality]),
  );
  return {
    id: r.id,
    created_at: r.created_at,
    input: r.input,
    localityNames,
    free_section: r.free_section,
    paid_section: r.is_paid ? r.paid_section : null,
    is_paid: r.is_paid,
  };
}
