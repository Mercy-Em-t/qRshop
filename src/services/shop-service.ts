import { supabase } from "./supabase-client";

export interface Shop {
  id: string;
  name: string;
  subdomain?: string;
  industry_type?: string;
  verification_level?: 'unverified' | 'bronze' | 'silver' | 'gold';
  created_at: string;
}

export interface Table {
  id: string;
  shop_id: string;
  table_number: string;
  created_at: string;
}

export async function getShop(shopId: string): Promise<Shop | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (error) {
    console.error("Error fetching shop:", error);
    return null;
  }

  return data as Shop;
}

export async function getShopBySubdomain(subdomain: string): Promise<Shop | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("subdomain", subdomain)
    .single();

  if (error) {
    console.error("Error fetching shop by subdomain:", error);
    return null;
  }

  return data as Shop;
}

export async function getTable(shopId: string, tableNumber: string): Promise<Table | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("shop_id", shopId)
    .eq("table_number", tableNumber)
    .single();

  if (error) {
    console.error("Error fetching table:", error);
    return null;
  }

  return data as Table;
}
