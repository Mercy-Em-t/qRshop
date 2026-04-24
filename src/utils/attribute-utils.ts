/**
 * Registry of standard attribute keys to prevent fragmentation 
 * (e.g. Color vs Colour, Qty vs Quantity).
 */
const ATTRIBUTE_MAP = {
  // Appearance
  color: ["colour", "shade", "tint"],
  size: ["dimensions", "dims", "measurement"],
  weight: ["mass", "heaviness"],
  material: ["fabric", "composition"],
  
  // Logistics
  sku: ["stock_keeping_unit", "product_code"],
  quantity: ["qty", "stock", "count", "inventory"],
  brand: ["manufacturer", "maker"],
  
  // Food & Beverage
  volume: ["size", "capacity"],
  calories: ["energy", "kcal"],
};

/**
 * Normalizes an attribute key by checking against known aliases.
 */
export function normalizeAttributeKey(key: string): string {
  const sanitized = key.trim().toLowerCase();
  
  for (const [standard, aliases] of Object.entries(ATTRIBUTE_MAP)) {
    if (standard === sanitized || aliases.includes(sanitized)) {
      return standard;
    }
  }
  
  return sanitized;
}

/**
 * Prettifies a key for UI display (e.g. "sku" -> "SKU", "color" -> "Color").
 */
export function formatAttributeLabel(key: string): string {
  if (key === "sku") return "SKU";
  return key.charAt(0).toUpperCase() + key.slice(1);
}
