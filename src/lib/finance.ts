import type { CashflowYear, InfraItem, LocalityMetrics, Market, ReportInput } from "@/types";

/**
 * All rates below are APPROXIMATE (individual buyer, urban property) and are
 * meant for indicative estimates only. Verify with the state IGR portal.
 */
interface StampRates {
  stampPct: number;
  regPct: number;
  regCap: number | null;
}

function stampRates(m: Market): StampRates {
  switch (m.state) {
    case "Haryana":
      return { stampPct: 7, regPct: 1, regCap: 50_000 };
    case "Uttar Pradesh":
      return { stampPct: 7, regPct: 1, regCap: null };
    case "Karnataka":
      return { stampPct: 5.6, regPct: 2, regCap: null }; // 5% + 10% cess
    case "Telangana":
      return { stampPct: 7, regPct: 0.5, regCap: null }; // stamp + transfer duty
    case "Maharashtra":
      // Mumbai 5% + 1% metro cess; Pune 5% + 1% metro cess + 1% LBT
      return { stampPct: m.city === "Pune" ? 7 : 6, regPct: 1, regCap: 30_000 };
    default:
      return { stampPct: 6, regPct: 1, regCap: null };
  }
}

export const DEFAULT_LOAN_PCT = 75;
export const INTEREST_RATE_PCT = 8.5;
export const TENURE_YEARS = 20;
const RENT_GROWTH = 0.05;
const MAINT_GROWTH = 0.05;
const PROPERTY_TAX_PCT = 0.1; // of price per year, rough
const VACANCY_MONTHS = 1;

export function emi(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const STATUS_W: Record<InfraItem["status"], number> = {
  operational: 0.6,
  under_construction: 1,
  approved: 0.7,
  proposed: 0.35,
};
const TYPE_W: Record<InfraItem["type"], number> = {
  metro: 1,
  airport: 1,
  expressway: 0.8,
  it_hub: 0.8,
  commercial_hub: 0.7,
};

/** 0–100 score: weights pending catalysts by type, certainty and how soon they land. */
export function infraScore(items: InfraItem[], now = new Date().getFullYear()): number {
  const raw = items.reduce((sum, it) => {
    const yrs = it.expected_year - now;
    const timeW = yrs < 0 ? 0.6 : yrs <= 4 ? 1 : yrs <= 6 ? 0.75 : 0.5;
    return sum + STATUS_W[it.status] * TYPE_W[it.type] * timeW;
  }, 0);
  return Math.round(100 * (1 - Math.exp(-raw / 1.6)));
}

export function computeMetrics(m: Market, input: ReportInput): LocalityMetrics {
  const isPlot = input.property_type === "Plot";
  const price_sqft = isPlot ? (m.avg_plot_price_sqft ?? Math.round(m.avg_price_sqft * 0.7)) : m.avg_price_sqft;

  // Flats use a typical unit size; plots are sized to the budget (net of ~8% duties).
  const size_sqft = isPlot
    ? Math.round(input.budget_inr / 1.08 / price_sqft)
    : input.property_type === "2BHK"
      ? m.typical_2bhk_sqft
      : m.typical_3bhk_sqft;

  const est_price = Math.round(size_sqft * price_sqft);
  const rates = stampRates(m);
  const stamp_duty = Math.round((est_price * rates.stampPct) / 100);
  const regRaw = (est_price * rates.regPct) / 100;
  const registration = Math.round(rates.regCap ? Math.min(regRaw, rates.regCap) : regRaw);
  const acquisition = est_price + stamp_duty + registration;

  const monthly_rent = isPlot ? null : input.property_type === "2BHK" ? m.avg_2bhk_rent : m.avg_3bhk_rent;
  const annualRent = (monthly_rent ?? 0) * 12;
  const annual_maintenance = isPlot ? 0 : Math.round(m.maintenance_per_sqft_month * size_sqft * 12);
  const gross_yield_pct = monthly_rent ? +((annualRent / est_price) * 100).toFixed(2) : null;
  const net_yield_pct = monthly_rent
    ? +(
        (((annualRent * (12 - VACANCY_MONTHS)) / 12 - annual_maintenance - (est_price * PROPERTY_TAX_PCT) / 100) /
          acquisition) *
        100
      ).toFixed(2)
    : null;

  const loanPct = input.loan_pct ?? DEFAULT_LOAN_PCT;
  const loan_amount = Math.round((est_price * loanPct) / 100);
  const emi_monthly = Math.round(emi(loan_amount, INTEREST_RATE_PCT, TENURE_YEARS));

  const cashflow: CashflowYear[] = [];
  let cumulative = 0;
  for (let y = 1; y <= 5; y++) {
    const rent = Math.round(annualRent * Math.pow(1 + RENT_GROWTH, y - 1));
    const maint = Math.round(annual_maintenance * Math.pow(1 + MAINT_GROWTH, y - 1));
    const emiYr = emi_monthly * 12;
    const net = rent - emiYr - maint;
    cumulative += net;
    cashflow.push({ year: y, emi: emiYr, rent, net, cumulative_net: cumulative });
  }

  return {
    slug: m.slug,
    locality: m.locality,
    size_sqft,
    price_sqft,
    est_price,
    within_budget: acquisition <= input.budget_inr * 1.05,
    monthly_rent,
    gross_yield_pct,
    stamp_duty,
    registration,
    stamp_duty_rate_pct: rates.stampPct,
    annual_maintenance,
    net_yield_pct,
    loan_amount,
    emi_monthly,
    interest_rate_pct: INTEREST_RATE_PCT,
    tenure_years: TENURE_YEARS,
    cashflow,
    projected_value_5y: Math.round(est_price * Math.pow(1 + m.price_cagr_5y_pct / 100 / 2, 5)),
    infra_score: infraScore(m.upcoming_infra),
    livability_score: m.livability_score,
    supply_risk: m.supply_risk,
  };
}
