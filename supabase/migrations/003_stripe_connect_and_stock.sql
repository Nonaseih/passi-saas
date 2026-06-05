-- ============================================================
-- Migration 003: Stripe Connect accounts, payments column, stock RPC
-- ============================================================

-- ── connected_accounts ───────────────────────────────────────
-- One row per operator (admin/staff user) who has gone through
-- Stripe Connect onboarding. Referenced by create-checkout-session
-- to route payments to the correct connected account.

CREATE TABLE connected_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id   TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all rows; the service role (Edge Functions) bypasses RLS
CREATE POLICY "connected_accounts_admin" ON connected_accounts
  FOR ALL USING (get_user_role() = 'admin');

-- ── payments.stripe_account_id ───────────────────────────────
-- Tracks which connected Stripe account processed the payment,
-- needed for refunds and reconciliation.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- ── decrement_stock RPC ──────────────────────────────────────
-- Called by the webhook after ticket issuance to atomically
-- reduce stock_remaining. Using a function prevents race conditions
-- that a plain UPDATE would have under concurrent checkouts.

CREATE OR REPLACE FUNCTION decrement_stock(
  p_ticket_type_id UUID,
  p_quantity       INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET stock_remaining = stock_remaining - p_quantity
  WHERE id = p_ticket_type_id
    AND stock_remaining >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for ticket_type %', p_ticket_type_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
