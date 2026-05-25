-- ============================================================
-- Migration 001: Initial Schema
-- PassI — アイドル特典券SaaS
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('fan', 'staff', 'admin');

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'fan',
  display_name  TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── events ───────────────────────────────────────────────────
CREATE TYPE event_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  date        TIMESTAMPTZ NOT NULL,
  venue       TEXT NOT NULL,
  status      event_status NOT NULL DEFAULT 'draft',
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ticket_types ─────────────────────────────────────────────
CREATE TABLE ticket_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL CHECK (price >= 0),   -- JPY
  stock           INTEGER NOT NULL CHECK (stock >= 0),
  stock_remaining INTEGER NOT NULL CHECK (stock_remaining >= 0),
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_remaining_lte_stock CHECK (stock_remaining <= stock)
);

-- ── tickets ──────────────────────────────────────────────────
CREATE TYPE ticket_status AS ENUM ('pending', 'active', 'used', 'expired', 'refunded');

CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  ticket_type_id  UUID NOT NULL REFERENCES ticket_types(id),
  event_id        UUID NOT NULL REFERENCES events(id),
  status          ticket_status NOT NULL DEFAULT 'pending',
  qr_token        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- one-time scan token
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at         TIMESTAMPTZ,
  used_by         UUID REFERENCES users(id),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure qr_token is immutable after issuance
CREATE UNIQUE INDEX idx_tickets_qr_token ON tickets(qr_token);

-- ── payments ─────────────────────────────────────────────────
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id),
  ticket_type_id            UUID NOT NULL REFERENCES ticket_types(id),
  stripe_session_id         TEXT NOT NULL UNIQUE,   -- idempotency key
  stripe_payment_intent_id  TEXT UNIQUE,
  amount                    INTEGER NOT NULL CHECK (amount > 0),  -- JPY
  quantity                  INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status                    payment_status NOT NULL DEFAULT 'pending',
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── scan_logs ────────────────────────────────────────────────
CREATE TABLE scan_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES tickets(id),
  staff_id     UUID NOT NULL REFERENCES users(id),
  scanned_at   TIMESTAMPTZ NOT NULL,
  device_id    TEXT NOT NULL,
  offline_flag BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_tickets_user_id       ON tickets(user_id);
CREATE INDEX idx_tickets_event_id      ON tickets(event_id);
CREATE INDEX idx_tickets_status        ON tickets(status);
CREATE INDEX idx_payments_user_id      ON payments(user_id);
CREATE INDEX idx_payments_status       ON payments(status);
CREATE INDEX idx_scan_logs_ticket_id   ON scan_logs(ticket_id);
CREATE INDEX idx_scan_logs_staff_id    ON scan_logs(staff_id);
CREATE INDEX idx_scan_logs_scanned_at  ON scan_logs(scanned_at);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ticket_types_updated_at
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
