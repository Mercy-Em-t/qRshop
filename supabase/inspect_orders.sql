-- DIAGNOSTIC: Inspecting Orders and Events
SELECT 
    tc.table_name, 
    kcu.column_name, 
    cc.check_clause
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_name IN ('orders', 'events');

-- Check for triggers on orders
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM 
    information_schema.triggers 
WHERE 
    event_object_table = 'orders';
