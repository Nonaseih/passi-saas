-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs    ENABLE ROW LEVEL SECURITY;

-- ── Helper: get current user role ────────────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── users ────────────────────────────────────────────────────
-- Users can read their own profile; admins can read all
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

-- Users can update their own profile (display_name, avatar_url only)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only service role can insert (done via sign-up trigger)
CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ── events ───────────────────────────────────────────────────
-- Published events are visible to all authenticated users
CREATE POLICY "events_select_published" ON events
  FOR SELECT USING (
    status = 'published'
    OR status = 'ongoing'
    OR get_user_role() IN ('staff', 'admin')
  );

-- Only admins can insert/update/delete events
CREATE POLICY "events_all_admin" ON events
  FOR ALL USING (get_user_role() = 'admin');

-- ── ticket_types ─────────────────────────────────────────────
-- Visible to all authenticated users (fans need to browse before purchase)
CREATE POLICY "ticket_types_select_all" ON ticket_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage ticket types
CREATE POLICY "ticket_types_all_admin" ON ticket_types
  FOR ALL USING (get_user_role() = 'admin');

-- ── tickets ──────────────────────────────────────────────────
-- Fans can only see their own tickets
CREATE POLICY "tickets_select_own" ON tickets
  FOR SELECT USING (
    user_id = auth.uid()
    OR get_user_role() IN ('staff', 'admin')
  );

-- Only the system (service role via Edge Function) can insert tickets
-- Fans cannot directly create tickets — only Stripe webhook can
CREATE POLICY "tickets_insert_service" ON tickets
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Staff can update ticket status (mogiri)
CREATE POLICY "tickets_update_staff" ON tickets
  FOR UPDATE USING (get_user_role() IN ('staff', 'admin'))
  WITH CHECK (get_user_role() IN ('staff', 'admin'));

-- ── payments ─────────────────────────────────────────────────
-- Users see their own payments; admins see all
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    user_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- Only service role creates/updates payment records
CREATE POLICY "payments_service_only" ON payments
  FOR ALL USING (get_user_role() = 'admin');

-- ── scan_logs ────────────────────────────────────────────────
-- Staff can insert scan logs (online or synced offline)
CREATE POLICY "scan_logs_insert_staff" ON scan_logs
  FOR INSERT WITH CHECK (get_user_role() IN ('staff', 'admin'));

-- Staff and admins can read scan logs
CREATE POLICY "scan_logs_select_staff" ON scan_logs
  FOR SELECT USING (get_user_role() IN ('staff', 'admin'));
