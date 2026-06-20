import { supabase } from "./supabase-client";

// --- SERVICES ---

export async function getServices(shopId) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching services:", err);
    return [];
  }
}

export async function getActiveServices(shopId) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching active services:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching active services:", err);
    return [];
  }
}

export async function getServiceById(serviceId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (error) {
      console.error("Error fetching service:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception fetching service:", err);
    return null;
  }
}

export async function createService(serviceData) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("services")
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating service:", err);
    throw err;
  }
}

export async function updateService(serviceId, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", serviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating service:", err);
    throw err;
  }
}

export async function deleteService(serviceId) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting service:", err);
    throw err;
  }
}

// --- SERVICE LEADS ---

export async function getServiceLeads(shopId, status = null) {
  if (!supabase) return [];
  try {
    let query = supabase
      .from("service_leads")
      .select("*, services(name)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
      
    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching service leads:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching service leads:", err);
    return [];
  }
}

export async function createServiceLead(leadData) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("service_leads")
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating service lead:", err);
    throw err;
  }
}

export async function updateServiceLeadStatus(leadId, status) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("service_leads")
      .update({ status })
      .eq("id", leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating service lead status:", err);
    throw err;
  }
}
