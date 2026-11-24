import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FreeSection, PaidSection, ReportInput, ReportRecord } from "@/types";

/**
 * Report persistence. Uses Supabase when NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set; otherwise falls back to an in-memory
 * store (dev only — data is lost on restart and not shared across instances).
 */

interface Row {
  id: string;
  created_at: string;
  city: ReportInput["city"];
  localities: string[];
  budget_inr: number;
  property_type: ReportInput["property_type"];
  goal: ReportInput["goal"];
  loan_pct: number | null;
  free_section: FreeSection;
  paid_section: PaidSection;
  is_paid: boolean;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
}

let supabase: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabase ??= createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

const g = globalThis as unknown as { __localityLensMem?: Map<string, Row> };
const mem = (g.__localityLensMem ??= new Map<string, Row>());

function toRecord(r: Row): ReportRecord {
  return {
    id: r.id,
    created_at: r.created_at,
    input: {
      city: r.city,
      localities: r.localities,
      budget_inr: Number(r.budget_inr),
      property_type: r.property_type,
      goal: r.goal,
      loan_pct: r.loan_pct == null ? null : Number(r.loan_pct),
    },
    free_section: r.free_section,
    paid_section: r.paid_section,
    is_paid: r.is_paid,
    razorpay_order_id: r.razorpay_order_id,
    razorpay_payment_id: r.razorpay_payment_id,
    paid_at: r.paid_at,
  };
}

export async function createReport(input: ReportInput, free: FreeSection, paid: PaidSection): Promise<string> {
  const row: Omit<Row, "id" | "created_at"> = {
    city: input.city,
    localities: input.localities,
    budget_inr: input.budget_inr,
    property_type: input.property_type,
    goal: input.goal,
    loan_pct: input.loan_pct,
    free_section: free,
    paid_section: paid,
    is_paid: false,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    paid_at: null,
  };
  const client = db();
  if (client) {
    const { data, error } = await client.from("reports").insert(row).select("id").single();
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    return data.id as string;
  }
  const id = crypto.randomUUID();
  mem.set(id, { ...row, id, created_at: new Date().toISOString() });
  return id;
}

export async function getReport(id: string): Promise<ReportRecord | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const client = db();
  if (client) {
    const { data, error } = await client.from("reports").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return data ? toRecord(data as Row) : null;
  }
  const r = mem.get(id);
  return r ? toRecord(r) : null;
}

export async function setOrderId(id: string, orderId: string): Promise<void> {
  const client = db();
  if (client) {
    const { error } = await client.from("reports").update({ razorpay_order_id: orderId }).eq("id", id);
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
    return;
  }
  const r = mem.get(id);
  if (r) r.razorpay_order_id = orderId;
}

export async function markPaid(id: string, paymentId: string): Promise<void> {
  const patch = { is_paid: true, razorpay_payment_id: paymentId, paid_at: new Date().toISOString() };
  const client = db();
  if (client) {
    const { error } = await client.from("reports").update(patch).eq("id", id);
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
    return;
  }
  const r = mem.get(id);
  if (r) Object.assign(r, patch);
}

export const storeMode = () => (db() ? "supabase" : "memory");
