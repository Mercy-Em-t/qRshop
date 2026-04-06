-- 1. Schema Extension for Shops (to support SalesBrain AI metadata)
ALTER TABLE IF EXISTS shops 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS brain_file TEXT,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chat_limit INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS sync_mode TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS sync_status TEXT,
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS sync_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_updated_at TIMESTAMPTZ;

-- 2. Business Mapping (Proxy View)
CREATE OR REPLACE VIEW businesses AS
SELECT 
    id, name, subdomain as slug, api_key, brain_file, 
    credits, chat_limit, sync_mode, sync_status, 
    sync_error, sync_last_synced_at, sync_updated_at, 
    created_at
FROM shops;

-- 3. Product Mapping (Menu Items)
CREATE OR REPLACE VIEW products AS
SELECT 
    id as id,
    shop_id as business_id,
    name as name,
    description as description,
    price as price,
    category as category,
    '[]'::jsonb as tags,
    99 as stock,
    created_at as created_at,
    id::text as external_id
FROM menu_items;

-- 4. SalesBrain Core Infrastructure (Missing Tables)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES shops(id),
    user_id TEXT,
    platform TEXT DEFAULT 'web',
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender TEXT,
    text TEXT,
    intent TEXT,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES shops(id) UNIQUE,
    data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Permissions
GRANT SELECT ON businesses TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON knowledge_base TO authenticated;

