import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Analysis, LocalityMetrics, Market, ReportInput, RiskItem } from "@/types";
import { GOAL_LABELS } from "@/types";
import { formatINR } from "@/lib/format";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/* ------------------------------------------------------------------ */
/* Output schema (JSON Schema for structured outputs + Zod validation) */
/* ------------------------------------------------------------------ */

const RISK_CATEGORIES = ["RERA", "Water", "Traffic", "Oversupply", "Legal", "Builder"] as const;

const AnalysisSchema = z.object({
  verdict: z.object({
    winner_slug: z.string(),
    headline: z.string(),
    summary: z.string(),
    fit_scores: z.array(z.object({ slug: z.string(), score: z.number(), one_liner: z.string() })),
  }),
  pros_cons: z.array(z.object({ slug: z.string(), pros: z.array(z.string()), cons: z.array(z.string()) })),
  infra_outlook: z.array(
    z.object({
      slug: z.string(),
      outlook: z.string(),
      timelines: z.array(
        z.object({ project: z.string(), official_year: z.number(), realistic_year: z.number(), note: z.string() }),
      ),
    }),
  ),
  risks: z.array(
    z.object({
      slug: z.string(),
      category: z.enum(RISK_CATEGORIES),
      item: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  negotiation_tips: z.array(z.string()),
});

const str = { type: "string" };
const num = { type: "number" };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const arr = (items: unknown) => ({ type: "array", items });

const JSON_SCHEMA = obj({
  verdict: obj({
    winner_slug: str,
    headline: str,
    summary: str,
    fit_scores: arr(obj({ slug: str, score: num, one_liner: str })),
  }),
  pros_cons: arr(obj({ slug: str, pros: arr(str), cons: arr(str) })),
  infra_outlook: arr(
    obj({
      slug: str,
      outlook: str,
      timelines: arr(obj({ project: str, official_year: num, realistic_year: num, note: str })),
    }),
  ),
  risks: arr(
    obj({
      slug: str,
      category: { type: "string", enum: [...RISK_CATEGORIES] },
      item: str,
      severity: { type: "string", enum: ["low", "medium", "high"] },
    }),
  ),
  negotiation_tips: arr(str),
});

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(markets: Market[], metrics: LocalityMetrics[]): string {
  return `You are LocalityLens, a sober, research-grade real estate investment analyst for Indian metro micro-markets.

GROUNDING RULES
- Use ONLY the figures in <market_data> and <computed_metrics> for prices, rents, yields, EMIs and infrastructure years. Never invent a number that is not there.
- The dataset is an approximate seed estimate, not verified data. Where it matters, tell the buyer what to verify (circle rates, current listings, RERA, official project status).
- Be realistic about Indian infrastructure timelines: projects marked "approved" or "proposed" commonly slip 2–4 years; "under_construction" often slips 1–2 years. Give a realistic_year for each project.
- Write for an Indian homebuyer/investor in plain English. Short sentences, no hype.
- Refer to localities by their slug in all slug fields. Use "ALL" as the slug for a risk that applies to every locality.

OUTPUT EXPECTATIONS
- verdict: pick the single best fit for the buyer's GOAL and BUDGET. fit_scores 0–100 for every locality.
- pros_cons: 3–4 pros and 3–4 cons per locality.
- infra_outlook: one per locality, covering every project in its upcoming_infra.
- risks: 8–12 checklist items spanning RERA verification checkpoints, water and traffic bottlenecks, oversupply and builder/legal risk.
- negotiation_tips: 4–6 concrete, India-specific tips.

<market_data>
${JSON.stringify(markets, null, 2)}
</market_data>

<computed_metrics>
${JSON.stringify(metrics, null, 2)}
</computed_metrics>`;
}

function buildUserPrompt(input: ReportInput, markets: Market[]): string {
  return `Compare these micro-markets in ${input.city}: ${markets.map((m) => `${m.locality} (${m.slug})`).join(" vs ")}.

Buyer profile:
- Budget: ${formatINR(input.budget_inr)} (${input.budget_inr} INR)
- Property type: ${input.property_type}
- Goal: ${GOAL_LABELS[input.goal]}
- Loan: ${input.loan_pct == null ? "not specified (metrics assume 75%)" : `${input.loan_pct}% of property value`}

Return the analysis as JSON matching the schema.`;
}

/* ------------------------------------------------------------------ */
/* Claude call                                                          */
/* ------------------------------------------------------------------ */

async function analyzeWithClaude(input: ReportInput, markets: Market[], metrics: LocalityMetrics[]) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // retry on a fallback model if a safety classifier declines
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: JSON_SCHEMA },
    },
    system: buildSystemPrompt(markets, metrics),
    messages: [{ role: "user", content: buildUserPrompt(input, markets) }],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    throw new Error(`Claude stopped early: ${response.stop_reason}`);
  }
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return AnalysisSchema.parse(JSON.parse(text));
}

/* ------------------------------------------------------------------ */
/* Rule-based fallback (no API key / API error) — zero-cost local dev   */
/* ------------------------------------------------------------------ */

/** Last clause of a dataset note, capitalised (e.g. "Water supply ... still maturing."). */
function lastClause(note: string): string {
  const parts = note.split(/;\s*|(?<=\.)\s+/).filter(Boolean);
  const t = parts[parts.length - 1].trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ruleBasedAnalysis(input: ReportInput, markets: Market[], metrics: LocalityMetrics[]): z.infer<typeof AnalysisSchema> {
  const supplyPenalty = { low: 0, medium: 6, high: 14 } as const;
  const scored = metrics.map((x) => {
    const m = markets.find((mm) => mm.slug === x.slug)!;
    const yieldPart = (x.gross_yield_pct ?? 0) * 12;
    const growthPart = m.price_cagr_5y_pct * 2.5 + x.infra_score * 0.35;
    const livePart = m.livability_score * 6;
    let score =
      input.goal === "rental_yield"
        ? yieldPart * 1.4 + livePart * 0.4 + x.infra_score * 0.2
        : input.goal === "capital_appreciation"
          ? growthPart + livePart * 0.2
          : livePart * 0.9 + x.infra_score * 0.25 + yieldPart * 0.2;
    score -= supplyPenalty[m.supply_risk];
    if (!x.within_budget) score -= 15;
    return { slug: x.slug, raw: score, m, x };
  });
  const max = Math.max(...scored.map((s) => s.raw));
  const min = Math.min(...scored.map((s) => s.raw));
  const norm = (v: number) => (max === min ? 75 : Math.round(55 + ((v - min) / (max - min)) * 35));
  const winner = scored.reduce((a, b) => (b.raw > a.raw ? b : a));

  const year = new Date().getFullYear();
  const slip = { operational: 0, under_construction: 1, approved: 3, proposed: 4 } as const;

  return {
    verdict: {
      winner_slug: winner.slug,
      headline: `${winner.m.locality} is the better fit for ${GOAL_LABELS[input.goal].toLowerCase()}`,
      summary: `On the seed dataset, ${winner.m.locality} balances ${input.goal === "rental_yield" ? `a ${winner.x.gross_yield_pct ?? "—"}% gross yield` : `a ${winner.m.price_cagr_5y_pct}% trailing price CAGR and an infra score of ${winner.x.infra_score}`} with ${winner.m.supply_risk} supply risk${winner.x.within_budget ? " and fits your budget" : ", though a typical unit stretches your budget"}. Treat these as directional estimates and verify current prices before deciding.`,
      fit_scores: scored.map((s) => ({
        slug: s.slug,
        score: norm(s.raw),
        one_liner: `${s.x.gross_yield_pct ?? "—"}% gross yield · infra ${s.x.infra_score}/100 · ${s.m.supply_risk} supply risk`,
      })),
    },
    pros_cons: scored.map(({ slug, m, x }) => ({
      slug,
      pros: [
        m.livability_score >= 7.5 ? `Strong livability (${m.livability_score}/10)` : `Improving livability (${m.livability_score}/10)`,
        x.infra_score >= 65 ? `Multiple near-term catalysts (infra score ${x.infra_score})` : `Some infra pipeline (score ${x.infra_score})`,
        `Trailing 5y price CAGR ~${m.price_cagr_5y_pct}%`,
        `Established developers: ${m.key_builders.slice(0, 3).join(", ")}`,
      ],
      cons: [
        m.supply_risk === "high" ? "High upcoming supply may cap appreciation and rents" : `${m.supply_risk[0].toUpperCase()}${m.supply_risk.slice(1)} supply risk`,
        (x.gross_yield_pct ?? 0) < 2.6 ? `Thin rental yield (${x.gross_yield_pct ?? "—"}%)` : "Rental yield is average, not exceptional",
        x.within_budget ? "Budget fits, but limited negotiating headroom on premium towers" : `Typical ${input.property_type} (~${formatINR(x.est_price)}) exceeds budget`,
        lastClause(m.notes),
      ],
    })),
    infra_outlook: markets.map((m) => ({
      slug: m.slug,
      outlook: `${m.upcoming_infra.filter((i) => i.status !== "operational").length} pending catalysts; ${m.notes.split(";")[0]}.`,
      timelines: m.upcoming_infra.map((i) => ({
        project: i.name,
        official_year: i.expected_year,
        realistic_year: Math.max(i.expected_year + slip[i.status], i.status === "operational" ? i.expected_year : year),
        note: i.status === "operational" ? "Already operational — largely priced in." : `Status: ${i.status.replace("_", " ")}; budget for slippage.`,
      })),
    })),
    risks: [
      { slug: "ALL", category: "RERA", item: "Verify the project's RERA registration number, approved completion date and quarterly progress updates on the state RERA portal.", severity: "high" },
      { slug: "ALL", category: "RERA", item: "Match the carpet area in the agreement with the RERA-registered plan; super built-up loading above ~30% is a red flag.", severity: "medium" },
      { slug: "ALL", category: "Legal", item: "Get title search (30 years), encumbrance certificate and occupancy/completion certificate checked by an independent lawyer.", severity: "high" },
      { slug: "ALL", category: "Builder", item: "Check the developer's delivery track record and any NCLT/insolvency proceedings.", severity: "medium" },
      ...markets.flatMap((m): z.infer<typeof AnalysisSchema>["risks"] => [
        ...(m.supply_risk !== "low"
          ? [{ slug: m.slug, category: "Oversupply" as const, item: `${m.locality}: count unsold inventory and new launches within 3 km before paying a premium.`, severity: m.supply_risk }]
          : []),
        { slug: m.slug, category: "Water", item: `${m.locality}: confirm municipal water connection vs. borewell/tanker dependence.`, severity: "medium" },
        { slug: m.slug, category: "Traffic", item: `${m.locality}: drive the office commute at peak hour before booking.`, severity: "low" },
      ]),
    ],
    negotiation_tips: [
      "Quote the RERA carpet-area rate, not the super built-up rate, when negotiating.",
      "Ask for PLC, floor-rise and car-park charges to be waived or bundled — they are often negotiable.",
      "Quarter-end and financial-year-end (March) are the best windows for developer discounts.",
      "For ready-to-move resale, benchmark against recent registered transactions, not listing prices.",
      "Link payment milestones to construction progress (CLP) rather than time-linked plans.",
    ],
  };
}

/* ------------------------------------------------------------------ */

export async function analyze(input: ReportInput, markets: Market[], metrics: LocalityMetrics[]): Promise<Analysis> {
  let raw: z.infer<typeof AnalysisSchema>;
  let source: Analysis["source"] = "claude";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      raw = await analyzeWithClaude(input, markets, metrics);
    } catch (err) {
      console.error("[analysis] Claude call failed, using rule-based analysis:", err);
      raw = ruleBasedAnalysis(input, markets, metrics);
      source = "rule_based";
    }
  } else {
    raw = ruleBasedAnalysis(input, markets, metrics);
    source = "rule_based";
  }

  // Keep only slugs we actually compared; guarantee a valid winner.
  const slugs = new Set(markets.map((m) => m.slug));
  if (!slugs.has(raw.verdict.winner_slug)) raw.verdict.winner_slug = markets[0].slug;
  const risks: RiskItem[] = raw.risks.map((r) => ({ ...r, slug: slugs.has(r.slug) ? r.slug : null }));

  return {
    verdict: { ...raw.verdict, fit_scores: raw.verdict.fit_scores.filter((f) => slugs.has(f.slug)) },
    pros_cons: raw.pros_cons.filter((p) => slugs.has(p.slug)),
    infra_outlook: raw.infra_outlook.filter((p) => slugs.has(p.slug)),
    risks,
    negotiation_tips: raw.negotiation_tips,
    source,
  };
}
