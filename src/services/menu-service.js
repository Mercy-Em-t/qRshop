import { supabase } from './supabase-client'

export async function fetchMenuItems(shopId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('shop_id', shopId)

  if (error) throw error
  return data
}

export async function fetchUpsellItems(itemId) {
  const { data, error } = await supabase
    .from('upsell_items')
    .select('*, menu_items!upsell_id(*)')
    .eq('item_id', itemId)

  if (error) throw error
  return data
}
