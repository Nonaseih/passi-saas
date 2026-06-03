-- ============================================================
-- Migration 005: Stripe Connect — Connected Accounts
-- ============================================================

-- One row per operator (admin user) linking their Stripe account
CREATE TABLE connected_accounts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id   TEXT        UNIQUE,
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can read/write their own row only
CREATE POLICY "admin_own_connected_account"
  ON connected_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND get_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() AND get_user_role() = 'admin');

-- Track which connected account processed each payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
