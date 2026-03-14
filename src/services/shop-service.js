import { supabase } from './supabase-client'

export async function fetchShop(shopId) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single()

  if (error) throw error
  return data
}

export async function fetchTables(shopId) {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('shop_id', shopId)

  if (error) throw error
  return data
}
