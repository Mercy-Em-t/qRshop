-- Emergency Schema Alignment for Modern Savannah v2.3
-- Restores missing operational columns for authentication and economics

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS platform_commission_rate DECIMAL(5,2) DEFAULT 0.00;

-- Comments for auditability
COMMENT ON COLUMN shops.logo_url IS 'Public URL for the merchant brand logo.';
COMMENT ON COLUMN shops.platform_commission_rate IS 'Percentage cut taken by Savannah on each transaction (e.g. 5.00 for 5%).';
