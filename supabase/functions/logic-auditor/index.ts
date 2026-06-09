import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
// Note: In Deno, relative paths outside the function directory may cause bundling issues depending on CLI version.
// For production, you might need to symlink or copy the lib to the function directory.
import { DiscreteEngineFacade } from "../../../src/lib/discrete_engine/FacadeAPI.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client using Auth Context from the Request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // 2. Parse payload
    const { shopId, startDate, endDate } = await req.json();

    if (!shopId || !startDate || !endDate) {
      throw new Error("Missing required parameters: shopId, startDate, endDate");
    }

    // 3. Initialize the Engine Facade
    const engine = new DiscreteEngineFacade(supabaseClient);
    
    // 4. Execute the grand unified pipeline
    const result = await engine.executeGrandUnifiedWorkspaceIntelligence(shopId, startDate, endDate);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Logic Auditor Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
