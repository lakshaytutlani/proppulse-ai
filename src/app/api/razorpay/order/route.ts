import { NextResponse } from "next/server";
import { z } from "zod";
import { getReport, setOrderId } from "@/lib/store";
import { razorpay, razorpayConfigured, REPORT_PRICE_PAISE } from "@/lib/razorpay";

export const runtime = "nodejs";

const Body = z.object({ reportId: z.string().uuid() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!razorpayConfigured()) {
    return NextResponse.json({ error: "Payments are not configured. Add Razorpay test keys to .env.local." }, { status: 503 });
  }

  const report = await getReport(parsed.data.reportId);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.is_paid) return NextResponse.json({ error: "Report already unlocked" }, { status: 409 });

  try {
    const order = await razorpay().orders.create({
      amount: REPORT_PRICE_PAISE,
      currency: "INR",
      receipt: `rpt_${report.id.slice(0, 32)}`,
      notes: { report_id: report.id },
    });
    await setOrderId(report.id, order.id);
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key id, safe to expose
    });
  } catch (err) {
    console.error("[razorpay/order] failed", err);
    return NextResponse.json({ error: "Could not create payment order" }, { status: 502 });
  }
}
