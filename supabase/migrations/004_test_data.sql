-- ============================================================
-- Migration 004: Test Data (DEV ONLY — remove before production)
-- ============================================================
-- Instructions:
-- 1. First create a user via the app's /register page OR
--    Supabase Dashboard > Authentication > Users > "Add user"
-- 2. Copy that user's UUID
-- 3. Replace the UUIDs below with your actual user IDs
-- 4. Run this script in SQL Editor
-- ============================================================

-- NOTE: Replace these with real UUIDs from your auth.users table
-- Admin user UUID  → create via Supabase Auth dashboard, then paste here
-- Fan user UUID    → create via /register in the app, then paste here

DO $$
DECLARE
  v_admin_id UUID := 'f53f6681-df2f-4198-87a2-d76fb3b0ea4e';
  v_fan_id   UUID := '3bc08f8d-cfe5-4dbd-9da3-2bef71fe0b46';
  v_event_id UUID := gen_random_uuid();
  v_tt1_id   UUID := gen_random_uuid();
  v_tt2_id   UUID := gen_random_uuid();
BEGIN

  -- Set admin role
  UPDATE users SET role = 'admin' WHERE id = v_admin_id;

  -- Insert test event
  INSERT INTO events (id, title, description, date, venue, status, created_by)
  VALUES (
    v_event_id,
    'テストライブ2026 〜PassI Summer〜',
    'PassIサービステスト用イベントです',
    NOW() + INTERVAL '7 days',
    'テスト会場（東京）',
    'published',
    v_admin_id
  );

  -- Ticket type 1: 2ショットチェキ
  INSERT INTO ticket_types (id, event_id, name, description, price, stock, stock_remaining)
  VALUES (
    v_tt1_id,
    v_event_id,
    '2ショットチェキ券',
    'メンバーとの2ショットポラロイド写真',
    3000,
    50,
    48
  );

  -- Ticket type 2: サイン会券
  INSERT INTO ticket_types (id, event_id, name, description, price, stock, stock_remaining)
  VALUES (
    v_tt2_id,
    v_event_id,
    'サイン会券',
    '直筆サイン入りグッズ付き',
    5000,
    30,
    30
  );

  -- Issue 2 test tickets to fan (active — ready to scan)
  INSERT INTO tickets (user_id, ticket_type_id, event_id, status, purchased_at)
  VALUES
    (v_fan_id, v_tt1_id, v_event_id, 'active', NOW()),
    (v_fan_id, v_tt1_id, v_event_id, 'active', NOW());

  RAISE NOTICE 'Test data inserted successfully!';
  RAISE NOTICE 'Event ID: %', v_event_id;
  RAISE NOTICE 'Ticket Type 1 (チェキ): %', v_tt1_id;
  RAISE NOTICE 'Ticket Type 2 (サイン): %', v_tt2_id;

END $$;
