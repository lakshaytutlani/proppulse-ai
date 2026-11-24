-- LocalityLens: reports table (run in Supabase SQL editor, free tier is fine)
create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  -- user inputs
  city                text not null check (city in ('Delhi NCR','Bengaluru','Mumbai','Hyderabad','Pune')),
  localities          text[] not null check (array_length(localities, 1) between 2 and 3),
  budget_inr          bigint not null check (budget_inr > 0),
  property_type       text not null check (property_type in ('2BHK','3BHK','Plot')),
  goal                text not null check (goal in ('self_use','rental_yield','capital_appreciation')),
  loan_pct            numeric(5,2) check (loan_pct is null or (loan_pct >= 0 and loan_pct <= 90)),

  -- generated report
  free_section        jsonb not null,   -- verdict, pros/cons, rent & yield summary
  paid_section        jsonb not null,   -- financial table, cashflow, infra, risks (served only when is_paid)

  -- payment
  is_paid             boolean not null default false,
  razorpay_order_id   text,
  razorpay_payment_id text,
  paid_at             timestamptz
);

create index if not exists reports_razorpay_order_id_idx on public.reports (razorpay_order_id);

-- Lock the table down: the app only talks to it from server routes with the
-- service-role key, which bypasses RLS. No anon/authenticated policies = no
-- direct browser access, so paid content can't be read without paying.
alter table public.reports enable row level security;
