import { NextResponse } from "next/server";
import { z } from "zod";
import { CITIES, GOALS, PROPERTY_TYPES } from "@/types";
import { getMarkets } from "@/lib/markets";
import { generateReport } from "@/lib/report";
import { createReport } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Hobby allows up to 60s

const Body = z.object({
  city: z.enum(CITIES),
  localities: z.array(z.string()).min(2).max(3),
  budget_inr: z.number().int().min(1_000_000).max(1_000_000_000),
  property_type: z.enum(PROPERTY_TYPES),
  goal: z.enum(GOALS),
  loan_pct: z.number().min(0).max(90).nullable(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }
  const input = { ...parsed.data, localities: [...new Set(parsed.data.localities)] };
  const markets = getMarkets(input.localities);
  if (markets.length < 2 || markets.some((m) => m.city !== input.city)) {
    return NextResponse.json({ error: "Pick 2–3 localities from the selected city." }, { status: 400 });
  }

  try {
    const { free, paid } = await generateReport(input);
    const id = await createReport(input, free, paid);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("[reports] failed", err);
    return NextResponse.json({ error: "Could not generate report. Please try again." }, { status: 500 });
  }
}
