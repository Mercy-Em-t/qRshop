-- ==========================================
-- Payment Audit Log (Centralized STK Tracking)
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  checkout_request_id TEXT UNIQUE NOT NULL,
  target_table TEXT NOT NULL, -- 'orders' or 'supplier_orders'
  target_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (though mostly used by Edge Functions)
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage payment logs"
  ON payment_audit_log
  FOR ALL
  USING (true); -- In practice, restrict to service role or authenticated admins
