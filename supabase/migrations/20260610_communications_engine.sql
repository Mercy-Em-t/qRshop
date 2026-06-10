-- Create an enum for target types
CREATE TYPE communication_target AS ENUM ('shop', 'customer');

-- Create a table to track communication preferences
CREATE TABLE IF NOT EXISTS shop_communication_settings (
    shop_id UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    custom_resend_key TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all existing shops have a settings row
INSERT INTO shop_communication_settings (shop_id)
SELECT id FROM shops
ON CONFLICT (shop_id) DO NOTHING;

-- Trigger to call edge functions on order events
CREATE OR REPLACE FUNCTION trigger_communications_engine()
RETURNS TRIGGER AS $$
DECLARE
    shop_phone TEXT;
    shop_name TEXT;
    customer_phone TEXT;
    customer_name TEXT;
    customer_email TEXT;
    order_total NUMERIC;
    order_summary TEXT;
    comm_settings RECORD;
    req_body JSON;
    wa_endpoint TEXT := current_setting('app.edge_function_url', true) || '/whatsapp-dispatch';
    email_endpoint TEXT := current_setting('app.edge_function_url', true) || '/email-dispatch';
    anon_key TEXT := current_setting('app.supabase_anon_key', true);
BEGIN
    -- Fetch Shop Details
    SELECT phone, whatsapp_number, name INTO shop_phone, shop_phone, shop_name 
    FROM shops WHERE id = NEW.shop_id;
    
    -- Prefer whatsapp_number if available
    SELECT whatsapp_number INTO shop_phone FROM shops WHERE id = NEW.shop_id AND whatsapp_number IS NOT NULL;
    IF shop_phone IS NULL THEN
        SELECT phone INTO shop_phone FROM shops WHERE id = NEW.shop_id;
    END IF;

    -- Fetch Communication Settings
    SELECT * INTO comm_settings FROM shop_communication_settings WHERE shop_id = NEW.shop_id;
    IF NOT FOUND THEN
        comm_settings := (NEW.shop_id, true, true, NULL, now())::shop_communication_settings;
    END IF;

    -- Fetch Customer Details (if attached to auth.users or from order metadata)
    -- Assuming client_name, client_phone, client_email are on the order table or metadata
    customer_name := NEW.client_name;
    customer_phone := NEW.client_phone;
    -- Some implementations store email in metadata
    IF NEW.metadata ? 'client_email' THEN
        customer_email := NEW.metadata->>'client_email';
    END IF;

    order_total := NEW.total_amount;
    
    -- Format a summary
    order_summary := 'Order ID: ' || NEW.id;

    -- EVENT 1: ORDER CREATED (Alert Shop)
    IF TG_OP = 'INSERT' AND comm_settings.whatsapp_enabled AND shop_phone IS NOT NULL THEN
        req_body := json_build_object(
            'order_id', NEW.id,
            'target_phone', shop_phone,
            'target_type', 'shop',
            'customer_name', customer_name,
            'shop_name', shop_name,
            'total', order_total,
            'summary', order_summary,
            'status', NEW.status
        );
        -- Async HTTP POST to Edge Function (Requires pg_net extension)
        -- Note: In Supabase, using pg_net or webhook triggers is preferred.
        PERFORM net.http_post(
            url := wa_endpoint,
            headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon_key),
            body := req_body::jsonb
        );
    END IF;

    -- EVENT 2: ORDER STATUS CHANGED (Alert Customer)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- WhatsApp to Customer
        IF comm_settings.whatsapp_enabled AND customer_phone IS NOT NULL THEN
            req_body := json_build_object(
                'order_id', NEW.id,
                'target_phone', customer_phone,
                'target_type', 'customer',
                'customer_name', customer_name,
                'shop_name', shop_name,
                'total', order_total,
                'summary', order_summary,
                'status', NEW.status
            );
            PERFORM net.http_post(
                url := wa_endpoint,
                headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon_key),
                body := req_body::jsonb
            );
        END IF;

        -- Email to Customer
        IF comm_settings.email_enabled AND customer_email IS NOT NULL THEN
            req_body := json_build_object(
                'order_id', NEW.id,
                'customer_email', customer_email,
                'customer_name', customer_name,
                'shop_name', shop_name,
                'total', order_total,
                'summary', order_summary,
                'status', NEW.status,
                'custom_resend_key', comm_settings.custom_resend_key
            );
            PERFORM net.http_post(
                url := email_endpoint,
                headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon_key),
                body := req_body::jsonb
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the Triggers on the orders table
DROP TRIGGER IF EXISTS order_communications_insert ON orders;
CREATE TRIGGER order_communications_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_communications_engine();

DROP TRIGGER IF EXISTS order_communications_update ON orders;
CREATE TRIGGER order_communications_update
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_communications_engine();
