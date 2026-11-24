import { NextResponse } from "next/server";
import { z } from "zod";
import { getReport, markPaid } from "@/lib/store";
import { razorpayConfigured, verifySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const Body = z.object({
  reportId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!razorpayConfigured()) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });

  const { reportId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
  const report = await getReport(reportId);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // The order must be the one we created for this report, and the signature must match.
  if (report.razorpay_order_id !== razorpay_order_id || !verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  if (!report.is_paid) await markPaid(reportId, razorpay_payment_id);
  // Return the paid section so the client can unlock without a reload.
  return NextResponse.json({ ok: true, paid_section: report.paid_section });
}
