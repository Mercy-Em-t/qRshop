import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://ocsuqfabqsyrbsewcaez.supabase.co";
const SERVICE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMjgyMCwiZXhwIjoyMDg5MDk4ODIwfQ.HYys17PBfYfhNgfGAJTrGmsVhgKf_jXHcdRvr_A0ikk";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const WHITNEY_EMAIL = "amoitwhitney21@gmail.com";
const WHITNEY_ID    = "b9e67073-9f39-4480-9548-cca86510d66a";

async function check() {
  console.log(`Checking status for ${WHITNEY_EMAIL} (${WHITNEY_ID})...`);

  const { data: profile } = await admin.from("profiles").select("*").eq("id", WHITNEY_ID).maybeSingle();
  console.log("V2 Profile:", profile || "MISSING");

  const { data: memberships } = await admin.from("shop_members").select("*, shops(name, subdomain)").eq("user_id", WHITNEY_ID);
  console.log("V2 Memberships:", memberships?.length || 0, "found");
  if (memberships?.length > 0) console.table(memberships.map(m => ({ shop: m.shops?.name, role: m.role, active: m.is_active })));

  const { data: legacy } = await admin.from("shop_users").select("*").eq("id", WHITNEY_ID).maybeSingle();
  console.log("Legacy shop_users:", legacy || "MISSING");
}

check();
