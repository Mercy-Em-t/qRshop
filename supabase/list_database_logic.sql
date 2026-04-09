-- =============================================================
-- DIAGNOSTIC: List All Triggers and Constraints
-- =============================================================
-- This will help us find hidden logic that might be blocking
-- our manual or SDK-based user creation.
-- =============================================================

-- 1. List All Triggers
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    action_statement AS action, 
    event_manipulation AS event, 
    action_timing AS timing
FROM information_schema.triggers
ORDER BY table_name, trigger_name;

-- 2. List All Constraints for shop_users
SELECT 
    conname AS constraint_name, 
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' 
AND conrelid = 'public.shop_users'::regclass;
