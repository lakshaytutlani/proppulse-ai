export const CITIES = ["Delhi NCR", "Bengaluru", "Mumbai", "Hyderabad", "Pune"] as const;
export type City = (typeof CITIES)[number];

export const PROPERTY_TYPES = ["2BHK", "3BHK", "Plot"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const GOALS = ["self_use", "rental_yield", "capital_appreciation"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  self_use: "Self-Use",
  rental_yield: "Rental Yield",
  capital_appreciation: "Capital Appreciation",
};

export type InfraStatus = "operational" | "under_construction" | "approved" | "proposed";
export type InfraType = "metro" | "expressway" | "airport" | "it_hub" | "commercial_hub";
export type SupplyRisk = "low" | "medium" | "high";

export interface InfraItem {
  name: string;
  type: InfraType;
  expected_year: number;
  status: InfraStatus;
}

export interface Market {
  city: City;
  state: string;
  locality: string;
  slug: string;
  avg_price_sqft: number;
  avg_2bhk_rent: number;
  avg_3bhk_rent: number;
  typical_2bhk_sqft: number;
  typical_3bhk_sqft: number;
  avg_plot_price_sqft: number | null;
  maintenance_per_sqft_month: number;
  price_cagr_5y_pct: number;
  gross_rental_yield_pct: number;
  livability_score: number;
  supply_risk: SupplyRisk;
  key_builders: string[];
  upcoming_infra: InfraItem[];
  notes: string;
}

export interface ReportInput {
  city: City;
  localities: string[]; // market slugs, 2–3
  budget_inr: number;
  property_type: PropertyType;
  goal: Goal;
  loan_pct: number | null;
}

/* ---------- Computed metrics (deterministic, from the dataset) ---------- */

export interface CashflowYear {
  year: number;
  emi: number; // annual EMI outflow
  rent: number; // annual rent (received if let out / avoided if self-use)
  net: number; // rent - emi - maintenance
  cumulative_net: number;
}

export interface LocalityMetrics {
  slug: string;
  locality: string;
  size_sqft: number;
  price_sqft: number;
  est_price: number;
  within_budget: boolean;
  monthly_rent: number | null;
  gross_yield_pct: number | null;
  stamp_duty: number;
  registration: number;
  stamp_duty_rate_pct: number;
  annual_maintenance: number;
  net_yield_pct: number | null;
  loan_amount: number;
  emi_monthly: number;
  interest_rate_pct: number;
  tenure_years: number;
  cashflow: CashflowYear[];
  projected_value_5y: number;
  infra_score: number; // 0–100
  livability_score: number;
  supply_risk: SupplyRisk;
}

/* ---------- Claude (or rule-based) qualitative analysis ---------- */

export interface Verdict {
  winner_slug: string;
  headline: string;
  summary: string;
  fit_scores: { slug: string; score: number; one_liner: string }[];
}

export interface ProsCons {
  slug: string;
  pros: string[];
  cons: string[];
}

export interface InfraOutlook {
  slug: string;
  outlook: string;
  timelines: { project: string; official_year: number; realistic_year: number; note: string }[];
}

export type RiskCategory = "RERA" | "Water" | "Traffic" | "Oversupply" | "Legal" | "Builder";

export interface RiskItem {
  slug: string | null; // null = applies to all
  category: RiskCategory;
  item: string;
  severity: "low" | "medium" | "high";
}

export interface Analysis {
  verdict: Verdict;
  pros_cons: ProsCons[];
  infra_outlook: InfraOutlook[];
  risks: RiskItem[];
  negotiation_tips: string[];
  source: "claude" | "rule_based";
}

/* ---------- Report sections ---------- */

export interface FreeSection {
  verdict: Verdict;
  pros_cons: ProsCons[];
  rent_summary: {
    slug: string;
    locality: string;
    monthly_rent: number | null;
    gross_yield_pct: number | null;
    est_price: number;
    within_budget: boolean;
  }[];
  analysis_source: Analysis["source"];
}

export interface PaidSection {
  metrics: LocalityMetrics[];
  infra_outlook: InfraOutlook[];
  risks: RiskItem[];
  negotiation_tips: string[];
}

export interface ReportRecord {
  id: string;
  created_at: string;
  input: ReportInput;
  free_section: FreeSection;
  paid_section: PaidSection;
  is_paid: boolean;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
}

/** What the browser receives: paid_section only when is_paid. */
export interface PublicReport {
  id: string;
  created_at: string;
  input: ReportInput;
  localityNames: Record<string, string>;
  free_section: FreeSection;
  paid_section: PaidSection | null;
  is_paid: boolean;
}
