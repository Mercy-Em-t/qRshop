import { supabase } from './src/lib/supabase.js';

async function fixConstraint() {
  const { data, error } = await supabase.rpc('query_exec', { query: `
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('delivery', 'dine_in', 'takeaway', 'instore', 'direct', 'whatsapp', 'pos', 'mpesa'));
  `});
  if (error) {
    console.log("Failed via RPC:", error);
  } else {
    console.log("Constraint updated successfully.");
  }
}
fixConstraint();
