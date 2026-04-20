import { supabase } from "./supabase-client";

/**
 * DATA BRIDGE SERVICE
 * A centralized abstraction layer to shield the UI from database schema changes.
 * ALL component-level database queries should eventually migrate here.
 */

// --- SHOP SERVICES ---

export const getShopProfile = async (shopIdentifier) => {
  // Supports both UUID and Slug-based lookups
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shopIdentifier);
  
  const query = supabase.from("shops").select("*");
  
  if (isUuid) {
    query.eq("shop_id", shopIdentifier);
  } else {
    query.eq("subdomain", shopIdentifier);
  }
  
  const { data, error } = await query.single();
  
  // Backward compatibility normalization
  if (data && !data.id) data.id = data.shop_id;
  
  return { data, error };
};

export const updateShopProfile = async (shopId, payload) => {
  return await supabase
    .from("shops")
    .update(payload)
    .eq("shop_id", shopId);
};

// --- PRODUCT SERVICES ---

export const getShopProducts = async (shopId) => {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, product_images(url)")
    .eq("shop_id", shopId)
    .order("category", { ascending: true });
    
  return { data, error };
};

export const saveProduct = async (shopId, payload, productId = null) => {
  if (productId) {
    return await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", productId)
      .eq("shop_id", shopId);
  } else {
    return await supabase
      .from("menu_items")
      .insert({ ...payload, shop_id: shopId })
      .select();
  }
};

// --- SYSTEM SERVICES ---

export const getSystemConfig = async (key) => {
  const { data, error } = await supabase
    .from("system_config")
    .select("config_value")
    .eq("config_key", key)
    .single();
    
  return data?.config_value || null;
};
