# PassI — アイドル特典券SaaS

デジタル特典券（チェキ券）の販売・QR発行・もぎり管理を行うSaaSプラットフォーム。

## Apps

| App | Path | Users |
|-----|------|-------|
| Fan App | `/` `/tickets` `/purchase` | ファン |
| Staff App | `/staff` `/staff/scan` | スタッフ（もぎり・枚数把握のみ、スマホ専用） |
| Admin Dashboard | `/admin` | admin ロールのみ（売上・イベント設定等） |

## Roles

| Role | Access |
|------|--------|
| `fan` | Fan app only |
| `staff` | Staff app only (scanner + history). Cannot access admin routes. |
| `admin` | Admin dashboard + staff app. Full access. |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Payments**: Stripe Connect **Custom** (PASSi manages operator review + bank account submission — operators have no Stripe dashboard)
- **QR**: qrcode + html5-qrcode
- **Offline**: IndexedDB (idb)
- **Deploy**: Vercel

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase + Stripe keys

# 3. Apply database migrations
# Go to Supabase Dashboard > SQL Editor and run:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_rls_policies.sql

# 4. Start dev server
npm run dev
```

## Branch Strategy

```
main        — production releases only
develop     — integration branch (PR target)
feature/*   — individual features
fix/*       — bug fixes
```

## Development Phases

| Phase | Milestone | Status |
|-------|-----------|--------|
| 1 | M1: Foundation + DB + Auth skeleton | ✅ Complete |
| 1 | M2: Auth + Stripe + QR issuance | ✅ Complete |
| 1 | M3: QR scan + mogiri + offline | 🔲 Pending |
| 1 | M4: Admin dashboard + testing | 🔲 Pending |

### M2 Progress
- [x] Auth (fan login / register / forgot-password / reset-password)
- [x] Stripe publishable key wired (`VITE_STRIPE_PUBLISHABLE_KEY`)
- [x] Stripe secret key added to Supabase Edge Function secrets
- [x] Edge functions written (`create-checkout-session`, `stripe-webhook`, `stripe-connect-onboard`)
- [x] `supabase/config.toml` created for CLI deployment
- [x] Stripe Connect changed from Express → **Custom** (PASSi-managed onboarding, `controller.requirement_collection: 'application'`)
- [x] Role gating confirmed: `staff` blocked from `/admin/*`, `admin` can use both apps
- [x] Edge functions deployed (`create-checkout-session`, `stripe-connect-onboard`, `stripe-webhook`)
- [x] `APP_URL` secret set in Supabase Edge Functions (`http://localhost:5173`)
- [x] `STRIPE_WEBHOOK_SECRET` received from client and added to Supabase secrets
- [ ] QR issuance verified post-payment
- [x] Root-caused client-reported checkout error: `create-checkout-session` 402s with "グループの Stripe 連携が未完了です" because no connected account can reach `onboarding_complete` until the M4 onboarding form exists — frontend was also swallowing the real error behind supabase-js's generic "non-2xx" message (fixed in `FanPurchase.tsx`)
- [ ] Run `complete-stripe-test-onboarding.mjs` (test-mode stopgap) to unblock one operator's checkout ahead of the real M4 form
- [ ] Client flagged M2 build as missing group/member selection, multi-item cart, and points vs. their prototype — confirmed these are out of the M1–M4 agreed scope (see `docs/client-scope-clarification-m2.md`); awaiting client decision on scope before building

> **Note — Stripe Connect Custom onboarding form** (collecting bank account + identity info and submitting to Stripe API) is deferred to **M4**.

## Project Structure

```
src/
  apps/
    fan/          # Fan mobile app
    staff/        # Staff mobile app
    admin/        # Admin PC dashboard
  components/
    shared/       # Cross-app components
    ui/           # shadcn/ui components
  contexts/       # React contexts (Auth)
  hooks/          # Custom hooks
  lib/
    supabase.ts   # Supabase client
    stripe.ts     # Stripe client
    qr.ts         # QR generation/parsing
    offline/      # IndexedDB + sync logic
  routes/         # Route definitions per app
  types/          # TypeScript types
supabase/
  migrations/     # SQL migrations
```
