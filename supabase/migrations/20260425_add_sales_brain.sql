-- Migration: Add sales_brain and ai_credits to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS sales_brain JSONB DEFAULT '{
  "personality": "Professional Sales Assistant",
  "sales_playbook": "1. Greet the customer warmly. 2. Identify their needs. 3. Suggest relevant products. 4. Guide them to checkout.",
  "custom_context": "This is a premium shop on the The Modern Savannah marketplace.",
  "tone": "not too chatty, not too rigid, professional and helpful"
}'::JSONB,
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 500;

-- Comment on columns for clarity
COMMENT ON COLUMN shops.sales_brain IS 'JSON configuration for the AI sales assistant personality and behavior.';
COMMENT ON COLUMN shops.ai_credits IS 'Remaining AI credits for the shop (1 credit = 1 message).';

-- Function to decrement credits securely
CREATE OR REPLACE FUNCTION decrement_ai_credits(sh_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shops
  SET ai_credits = ai_credits - 1
  WHERE shop_id = sh_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
