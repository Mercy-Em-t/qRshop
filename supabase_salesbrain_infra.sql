-- SALESBRAIN INFRASTRUCTURE: Core tables for AI Engagement Engine
-- These tables enable SalesBrain to run inside the ShopQR Supabase instance

-- 1. Conversations (AI Session tracking)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES shops(id),
    user_id TEXT,
    platform TEXT DEFAULT 'web', -- web, whatsapp, etc.
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages (Chat history)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender TEXT, -- 'ai' or 'user'
    text TEXT,
    intent TEXT,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Knowledge Base (Custom rules for each shop)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES shops(id) UNIQUE,
    data JSONB DEFAULT '{}', -- Store training data, personality, rules
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Abandoned Carts (AI Recovery)
CREATE TABLE IF NOT EXISTS salesbrain_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES shops(id),
    external_cart_id TEXT,
    items JSONB DEFAULT '[]',
    customer_info JSONB DEFAULT '{}',
    is_recovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_business ON knowledge_base(business_id);

-- RLS (Optional - but for security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated backend services
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON knowledge_base TO authenticated;
GRANT ALL ON salesbrain_carts TO authenticated;
