-- ============================================================
-- Migration 003: RPC Functions
-- ============================================================

-- Atomic stock decrement — prevents race conditions on concurrent purchases
CREATE OR REPLACE FUNCTION decrement_stock(
  p_ticket_type_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE ticket_types
  SET stock_remaining = stock_remaining - p_quantity
  WHERE id = p_ticket_type_id
    AND stock_remaining >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION '在庫が不足しています (ticket_type_id: %)', p_ticket_type_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
