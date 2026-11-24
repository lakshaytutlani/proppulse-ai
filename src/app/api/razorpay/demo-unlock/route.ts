import { NextResponse } from "next/server";
import { z } from "zod";
import { getReport, markPaid } from "@/lib/store";

export const runtime = "nodejs";

const Body = z.object({ reportId: z.string().uuid() });

/** Local-testing only: unlocks a report without payment. Disabled outside `next dev`. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const report = await getReport(parsed.data.reportId);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  await markPaid(report.id, "demo_unlock");
  return NextResponse.json({ ok: true, paid_section: report.paid_section });
}
