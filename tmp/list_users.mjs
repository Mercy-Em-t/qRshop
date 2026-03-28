import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllUsers() {
  const { data, error } = await supabase
    .from('shop_users')
    .select('email, role, shop_id')
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }
  
  console.log('Users found:', JSON.stringify(data, null, 2))
}

listAllUsers()
