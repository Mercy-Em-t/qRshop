-- ===========================================
-- FINAL SECRET INJECTION (SANDBOX)
-- Run this in your Supabase SQL Editor
-- ===========================================

-- 1. Insert M-Pesa Consumer Key
INSERT INTO internal_security.platform_secrets (name, secret, description)
VALUES (
    'MPESA_CONSUMER_KEY', 
    'Dj2r3ZoXesgpDbCGSRHZFR27gT84U4GgCGfAhldgNR34NHmX', 
    'M-Pesa Daraja Sandbox Consumer Key'
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 2. Insert M-Pesa Consumer Secret
INSERT INTO internal_security.platform_secrets (name, secret, description)
VALUES (
    'MPESA_CONSUMER_SECRET', 
    'NWBcjE3IyoEenemOJYtDcDrWqnxDnevmNwriDTVGKMqZTgk3suuA9f68kzq8XKs3', 
    'M-Pesa Daraja Sandbox Consumer Secret'
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 3. Set Environment to Sandbox
INSERT INTO internal_security.platform_secrets (name, secret, description)
VALUES (
    'MPESA_ENVIRONMENT', 
    'sandbox', 
    'Target M-Pesa API Environment'
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 4. Insert Twilio Recovery Code (Failsafe)
INSERT INTO internal_security.platform_secrets (name, secret, description)
VALUES (
    'TWILIO_RECOVERY_CODE', 
    'TUL1DS16W24278GAYRHE3FBT', 
    'Twilio Failsafe Recovery Code'
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- 5. Verify Insertion (Optional)
-- SELECT name, description FROM internal_security.platform_secrets;
