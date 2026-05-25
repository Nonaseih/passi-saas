# PassI — アイドル特典券SaaS

デジタル特典券（チェキ券）の販売・QR発行・もぎり管理を行うSaaSプラットフォーム。

## Apps

| App | Path | Users |
|-----|------|-------|
| Fan App | `/` `/tickets` `/purchase` | ファン |
| Staff App | `/staff` `/staff/scan` | スタッフ |
| Admin Dashboard | `/admin` | 運営 |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Payments**: Stripe
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
| 1 | M2: Auth + Stripe + QR issuance | 🔲 Pending |
| 1 | M3: QR scan + mogiri + offline | 🔲 Pending |
| 1 | M4: Admin dashboard + testing | 🔲 Pending |

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
