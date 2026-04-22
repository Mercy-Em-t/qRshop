import { supabase } from "./supabase-client";

/**
 * template-service.js
 * Manages shop-specific product templates and dynamic fields.
 */

export const fetchTemplates = async (shopId) => {
  const { data, error } = await supabase
    .from("product_templates")
    .select(`
      *,
      product_template_fields (*)
    `)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTemplate = async (shopId, name, description, fields = []) => {
  // 1. Create Template
  const { data: template, error: tError } = await supabase
    .from("product_templates")
    .insert([{ shop_id: shopId, name, description }])
    .select()
    .single();

  if (tError) throw tError;

  // 2. Insert Fields if any
  if (fields.length > 0) {
    const fieldsToInsert = fields.map((f, index) => ({
      template_id: template.id,
      label: f.label,
      field_key: f.field_key || f.label.toLowerCase().replace(/\s+/g, '_'),
      field_type: f.field_type || 'text',
      options: f.options || [],
      is_required: !!f.is_required,
      sort_order: index
    }));

    const { error: fError } = await supabase
      .from("product_template_fields")
      .insert(fieldsToInsert);

    if (fError) throw fError;
  }

  return template;
};

export const deleteTemplate = async (templateId) => {
  const { error } = await supabase
    .from("product_templates")
    .delete()
    .eq("id", templateId);
  
  if (error) throw error;
};

export const updateTemplate = async (templateId, name, description) => {
  const { error } = await supabase
    .from("product_templates")
    .update({ name, description, updated_at: new Date() })
    .eq("id", templateId);
  
  if (error) throw error;
};
