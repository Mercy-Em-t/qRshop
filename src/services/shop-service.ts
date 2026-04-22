import { supabase } from "./supabase-client";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  slug_history?: string[];
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
    .select("*, id:shop_id")
    .eq("shop_id", shopId)
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
    .select("*, id:shop_id")
    .eq("subdomain", subdomain)
    .single();


  if (error) {
    console.error("Error fetching shop by subdomain:", error);
    return null;
  }

  return data as Shop;
}

export async function resolveShopIdentifier(identifier: string): Promise<Shop | null> {
  if (!supabase) return null;

  // Resolve by ID (UUID), Slug, Subdomain, or Slug History
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(identifier);

  let query = supabase.from("shops").select("*, id:shop_id");
  
  if (isUUID) {
    query = query.or(`shop_id.eq.${identifier},slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  } else {
    query = query.or(`slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error resolving shop identifier:", error);
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
