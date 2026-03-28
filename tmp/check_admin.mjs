import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://ocsuqfabqsyrbsewcaez.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

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
