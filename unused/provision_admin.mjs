import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function provision() {
  console.log('Provisioning God-Mode Admin...');
  
  // 1. Check if demoshop exists
  const { data: shops } = await supabase.from('shops').select('id').eq('name', 'demoshop').single();
  const shopId = shops?.id || '11111111-1111-1111-1111-111111111111';

  // 2. Add admin@qrshop.com to shop_users
  const { error } = await supabase.from('shop_users').upsert({
    email: 'admin@qrshop.com',
    password: 'admin123',
    role: 'system_admin',
    shop_id: shopId
  }, { onConflict: 'email' });

  if (error) {
    console.error('Provisioning failed:', error);
  } else {
    console.log('SUCCESS: admin@qrshop.com (password: admin123) is now active.');
  }
}

provision();
