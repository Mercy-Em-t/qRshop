import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Self-contained helpers
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(url, host) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `https://${host}${cleanUrl}`;
}

async function resolveShop(identifier) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(identifier);

  let query = supabase.from("shops").select("*");
  if (isUUID) {
    query = query.or(`shop_id.eq.${identifier},slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  } else {
    query = query.or(`slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Feed Shop DB Error:", error);
    return null;
  }

  if (!data && !isUUID) {
    // Check legacy redirects table
    const { data: redirectData } = await supabase
      .from("shop_slug_redirects")
      .select("shop_id")
      .eq("old_slug", identifier)
      .maybeSingle();

    if (redirectData) {
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_id", redirectData.shop_id)
        .single();
      return shopData;
    }
  }

  return data;
}

// Map store categories to Google Product Taxonomy (official paths)
const GOOGLE_CATEGORY_MAP = {
  'cereals & grains': 'Food, Beverages & Tobacco > Food Items > Grains, Rice & Cereal',
  'pulses & legumes': 'Food, Beverages & Tobacco > Food Items > Grains, Rice & Cereal',
  'nuts & nut products': 'Food, Beverages & Tobacco > Food Items > Nuts & Seeds',
  'seeds': 'Food, Beverages & Tobacco > Food Items > Nuts & Seeds',
  'spices & seasonings': 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices',
  'natural sweeteners & additives': 'Food, Beverages & Tobacco > Food Items > Sugar & Sweeteners',
  'beverages': 'Food, Beverages & Tobacco > Beverages',
  'dried fruits': 'Food, Beverages & Tobacco > Food Items > Fruits & Vegetables',
  'cooking essentials': 'Food, Beverages & Tobacco > Food Items > Cooking & Baking Ingredients',
  'ready-to-eat / convenience': 'Food, Beverages & Tobacco > Food Items > Prepared Foods',
  'main': 'Food, Beverages & Tobacco > Food Items',
  'mains': 'Food, Beverages & Tobacco > Food Items',
  'sides': 'Food, Beverages & Tobacco > Food Items',
  'dessert': 'Food, Beverages & Tobacco > Food Items',
  'drinks': 'Food, Beverages & Tobacco > Beverages',
};

function resolveGoogleCategory(item) {
  if (item.attributes?.google_product_category_id) {
    return item.attributes.google_product_category_id.toString();
  }
  if (item.attributes?.google_product_category) {
    return item.attributes.google_product_category;
  }
  if (!item.category) return 'Food, Beverages & Tobacco > Food Items';
  const key = item.category.toLowerCase().trim();
  return GOOGLE_CATEGORY_MAP[key] || 'Food, Beverages & Tobacco > Food Items';
}

// Parse weight from attributes or product name
function parseShippingWeight(item) {
  if (item.attributes?.shipping_weight) return escapeXml(item.attributes.shipping_weight);
  
  const attrWeight = item.attributes?.weight;
  if (attrWeight) {
    const match = String(attrWeight).match(/([\d.]+)\s*(kg|g|lb|oz)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'g') return `${(value / 1000).toFixed(3)} kg`;
      if (unit === 'kg') return `${value.toFixed(3)} kg`;
      if (unit === 'lb') return `${value.toFixed(3)} lb`;
      if (unit === 'oz') return `${value.toFixed(3)} oz`;
    }
  }
  const nameMatch = String(item.name || '').match(/([\d.]+)\s*(kg|g|lb|oz)/i);
  if (nameMatch) {
    const value = parseFloat(nameMatch[1]);
    const unit = nameMatch[2].toLowerCase();
    if (unit === 'g') return `${(value / 1000).toFixed(3)} kg`;
    if (unit === 'kg') return `${value.toFixed(3)} kg`;
    if (unit === 'lb') return `${value.toFixed(3)} lb`;
    if (unit === 'oz') return `${value.toFixed(3)} oz`;
  }
  return '0.500 kg';
}

export default async function handler(req, res) {
  const shopIdentifier = req.query.shop || req.query.id;
  const host = req.headers.host || 'www.yourshop.com';

  if (!shopIdentifier) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: "Missing required parameter 'shop' or 'id'." });
  }

  try {
    const shop = await resolveShop(shopIdentifier);
    if (!shop) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: `Shop not found with identifier '${shopIdentifier}'.` });
    }

    const shopId = shop.id || shop.shop_id;

    // Fetch all active products
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('shop_id', shopId);

    if (itemsError) {
      console.error("Feed Menu Items Fetch Error:", itemsError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: "Database error fetching products." });
    }

    const shopName = escapeXml(shop.name);
    const shopLink = toAbsoluteUrl(`/s/${shop.slug || shopId}`, host);
    const shopDesc = escapeXml(shop.description || shop.tagline || `${shop.name} product catalog.`);

    // Build XML RSS Channel
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${shopName}</title>
    <link>${escapeXml(shopLink)}</link>
    <description>${shopDesc}</description>
`;

    if (items && items.length > 0) {
      for (const item of items) {
        // Skip items with invalid prices
        const rawPrice = parseFloat(item.price || 0);
        if (rawPrice <= 0) continue;
        // Skip inactive items
        if (item.is_active === false) continue;

        const itemId = item.id;
        const itemSku = escapeXml(item.sku || itemId);
        const itemName = escapeXml(item.name);
        const itemDesc = escapeXml(item.description || `${item.name} available at ${shop.name}.`);
        
        // Link to the dynamic product details page
        const productSlug = slugify(item.name);
        const itemLink = toAbsoluteUrl(`/product/${productSlug}/${itemId}`, host);
        
        // Resolve product images
        let imgUrl = '';
        if (item.product_images && item.product_images.length > 0) {
          imgUrl = item.product_images[0].url;
        } else if (item.image_url) {
          imgUrl = item.image_url;
        }
        
        const absoluteImgUrl = imgUrl ? toAbsoluteUrl(imgUrl, host) : toAbsoluteUrl('/flax-seeds.png', host); // fallback
        const itemPrice = `${rawPrice.toFixed(2)} KES`;
        const itemAvailability = item.stock === 0 ? 'out of stock' : 'in stock';
        const itemBrand = escapeXml(item.attributes?.brand || item.brand || shop.name);
        const googleCategory = escapeXml(resolveGoogleCategory(item));
        const shippingWeight = parseShippingWeight(item);
        const gtin = item.attributes?.gtin ? escapeXml(item.attributes.gtin) : '';
        const condition = escapeXml(item.attributes?.condition || 'new');

        xml += `    <item>
      <g:id>${itemSku}</g:id>
      <g:title>${itemName}</g:title>
      <g:description>${itemDesc}</g:description>
      <g:link>${escapeXml(itemLink)}</g:link>
      <g:image_link>${escapeXml(absoluteImgUrl)}</g:image_link>
      <g:condition>${condition}</g:condition>
      <g:availability>${itemAvailability}</g:availability>
      <g:price>${itemPrice}</g:price>
      <g:brand>${itemBrand}</g:brand>
      ${gtin ? `<g:gtin>${gtin}</g:gtin>` : ''}
      <g:mpn>${itemSku}</g:mpn>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:shipping_weight>${shippingWeight}</g:shipping_weight>
`;

        xml += `    </item>\n`;
      }
    }

    xml += `  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // cache at edge for 1 hour
    return res.status(200).send(xml);

  } catch (err) {
    console.error("Feed Generator Exception:", err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
