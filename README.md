# PropPulse AI

AI Real Estate Investment & Rental Yield Copilot for Indian metros (Delhi NCR, Bengaluru, Mumbai, Hyderabad, Pune).
Compare 2–3 micro-markets, get a free verdict, and unlock a ₹499 deep-dive via Razorpay.

## Stack (zero fixed cost)
| Layer | Choice | Cost |
|---|---|---|
| App | Next.js 15 (App Router) + TypeScript + Tailwind v4 | free |
| Charts | Recharts | free |
| DB | Supabase (free tier) — optional locally | free |
| Hosting | Vercel Hobby | free |
| Payments | Razorpay **test mode** (live mode charges only a % per txn) | free |
| AI | Claude API — **optional**; falls back to a rule-based analysis without a key | pay-per-use |

## Run locally
```bash
npm install
cp .env.example .env.local   # every key is optional for a first run
npm run dev                  # http://localhost:3000
```
With no keys: reports are stored in memory, the analysis is rule-based, and the **Demo Unlock** switch
on the paywall (shown only under `npm run dev`) unlocks the paid section.

## Setup for real use
1. **Supabase**: create a free project → SQL editor → run `supabase/schema.sql`. Put the project URL and
   *service role* key in `.env.local`. RLS is on with no policies, so only server routes can read reports.
2. **Razorpay**: Dashboard → test mode → API Keys → put `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env.local`.
   Test card `4111 1111 1111 1111`, any future expiry/CVV, or UPI `success@razorpay`.
3. **Claude**: add `ANTHROPIC_API_KEY`. Default model is `claude-opus-5-5`; set `ANTHROPIC_MODEL=claude-haiku-5-5` for a much cheaper option.
4. **Deploy**: push to GitHub → import on Vercel → add the same env vars.

## How grounding works
`data/metro-markets.json` holds 18 micro-markets. For a request, the matching localities **and** the
deterministic metrics computed from them (`src/lib/finance.ts`: price, stamp duty, net yield, EMI, 5-year cashflow,
infra score) are injected into Claude's system prompt (`src/lib/analysis.ts`). Claude only writes the qualitative layer
(verdict, pros/cons, realistic infra timelines, risks, negotiation tips) as schema-validated JSON — every number on the
page comes from the dataset or the finance module.

> ⚠️ The seed figures are **approximate estimates**, not verified data. Refresh them from current listings,
> circle rates, state RERA portals and official project updates before using this commercially.

## Payment flow
1. `POST /api/reports` → generates the report, stores it with `is_paid = false`.
2. `/report/[id]` renders the free section; the paid section is **never sent** to the browser until paid.
3. `POST /api/razorpay/order` → creates a ₹499 order and saves its id on the report.
4. Razorpay Checkout → `POST /api/razorpay/verify` checks the HMAC signature and that the order belongs to the report,
   sets `is_paid = true`, and returns the paid section so the page unlocks without reloading.
5. `POST /api/razorpay/demo-unlock` returns 404 unless `NODE_ENV === "development"`.

## Structure
```
data/metro-markets.json          seed dataset (approximate)
supabase/schema.sql              reports table
src/app/page.tsx                 landing + form
src/app/report/[id]/page.tsx     freemium report
src/app/api/reports              create report
src/app/api/razorpay/{order,verify,demo-unlock}
src/components/{form,report,ui}  UI modules
src/lib/{markets,finance,analysis,report,store,razorpay,format}.ts
src/types/index.ts               shared types
```
