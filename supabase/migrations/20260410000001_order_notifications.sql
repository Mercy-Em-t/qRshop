-- Create order_notifications table for audit trail
CREATE TABLE IF NOT EXISTS order_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    recipient_phone TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
