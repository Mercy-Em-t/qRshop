import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ocsuqfabqsyrbsewcaez.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMjgyMCwiZXhwIjoyMDg5MDk4ODIwfQ.HYys17PBfYfhNgfGAJTrGmsVhgKf_jXHcdRvr_A0ikk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin() {
  const { data, error } = await supabase
    .from('shop_users')
    .select('email, role')
    .eq('role', 'system_admin')
  
  if (error) {
    console.error('Error fetching admins:', error)
    return
  }
  
  console.log('System Admins found:', data)
}

checkAdmin()
