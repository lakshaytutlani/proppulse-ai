"use client";

import { useState } from "react";
import Script from "next/script";
import type { PaidSection } from "@/types";

/* Minimal typing for Razorpay Checkout (loaded from checkout.razorpay.com). */
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (r: { error: { description: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const IS_DEV = process.env.NODE_ENV === "development";

export default function Paywall({ reportId, onUnlock }: { reportId: string; onUnlock: (p: PaidSection) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function pay() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not start payment");
      if (!window.Razorpay) throw new Error("Payment library failed to load. Check your connection.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "LocalityLens",
        description: "Full micro-market deep-dive report",
        theme: { color: "#34d399" },
        handler: async (r: RazorpayResponse) => {
          try {
            const v = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId, ...r }),
            });
            const data = await v.json();
            if (!v.ok) throw new Error(data.error || "Verification failed");
            onUnlock(data.paid_section);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error.description);
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setBusy(false);
    }
  }

  async function demoUnlock() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/razorpay/demo-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo unlock failed");
      onUnlock(data.paid_section);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo unlock failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-accent/30 bg-panel/95 p-6 text-center shadow-2xl shadow-black/60 backdrop-blur">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h3 className="mt-3 text-lg font-semibold">Unlock the full deep-dive</h3>
      <ul className="mx-auto mt-3 max-w-xs space-y-1.5 text-left text-sm text-muted">
        <li>✓ Stamp duty, net yield & 5-year EMI vs rent simulation</li>
        <li>✓ Infrastructure score with realistic timelines</li>
        <li>✓ RERA & red-flag checklist + negotiation tips</li>
      </ul>
      <button
        onClick={pay}
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Processing…" : "Unlock for ₹499"}
      </button>
      <p className="mt-2 text-[11px] text-muted">Secure payment via Razorpay · UPI, cards, netbanking</p>

      {IS_DEV ? (
        <div className="mt-4 rounded-lg border border-dashed border-warn/40 bg-warn/5 p-3 text-left">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
            <span>
              <span className="font-semibold text-warn">Demo Unlock</span>
              <span className="block text-muted">Development only — skips payment.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={demo}
              disabled={busy}
              onChange={(e) => {
                setDemo(e.target.checked);
                if (e.target.checked) void demoUnlock();
              }}
              className="h-4 w-4 accent-[var(--warn)]"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
