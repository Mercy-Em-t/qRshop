import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for Base64Url encoding
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate Google Service Account signed JWT
function signJwt(privateKey, clientEmail) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const base64Header = base64url(JSON.stringify(header));

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/content',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const base64Claim = base64url(JSON.stringify(claimSet));

  const signatureInput = `${base64Header}.${base64Claim}`;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64url');

  return `${signatureInput}.${signature}`;
}

// Get Google access token using JWT
async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Service Account environment variables.");
  }

  // Handle escaped newlines in Vercel env settings
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  const jwt = signJwt(formattedKey, clientEmail);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Token API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Helper to compile absolute URLs
function toAbsoluteUrl(url, host) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `https://${host}${cleanUrl}`;
}

// Helper to convert names to slugs
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Map store categories to Google Product Taxonomy (official paths)
// Reference: https://support.google.com/merchants/answer/6324436
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
  // 1. Prefer explicit Google Product Category ID
  if (item.attributes?.google_product_category_id) {
    return item.attributes.google_product_category_id;
  }
  // 2. Or explicit path
  if (item.attributes?.google_product_category) {
    return item.attributes.google_product_category;
  }
  // 3. Fallback to heuristic mapping
  if (!item.category) return 'Food, Beverages & Tobacco > Food Items';
  const key = item.category.toLowerCase().trim();
  return GOOGLE_CATEGORY_MAP[key] || 'Food, Beverages & Tobacco > Food Items';
}

function parseShippingWeight(item) {
  const attrWeight = item.attributes?.shipping_weight || item.attributes?.weight;
  if (attrWeight) {
    // Try to extract numeric value and unit
    const match = String(attrWeight).match(/([\d.]+)\s*(kg|g|lb|oz)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'g') return { value: (value / 1000).toFixed(3), unit: 'kg' };
      if (unit === 'kg') return { value: value.toFixed(3), unit: 'kg' };
      if (unit === 'lb') return { value: value.toFixed(3), unit: 'lb' };
      if (unit === 'oz') return { value: value.toFixed(3), unit: 'oz' };
    }
  }
  // Fallback: try to extract weight from product name (e.g., "Chia seeds 100g")
  const nameMatch = String(item.name || '').match(/([\d.]+)\s*(kg|g|lb|oz)/i);
  if (nameMatch) {
    const value = parseFloat(nameMatch[1]);
    const unit = nameMatch[2].toLowerCase();
    if (unit === 'g') return { value: (value / 1000).toFixed(3), unit: 'kg' };
    if (unit === 'kg') return { value: value.toFixed(3), unit: 'kg' };
    if (unit === 'lb') return { value: value.toFixed(3), unit: 'lb' };
    if (unit === 'oz') return { value: value.toFixed(3), unit: 'oz' };
  }
  // Default: 0.5kg for grocery items
  return { value: '0.500', unit: 'kg' };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const { action, shopId } = req.query;
  const host = req.headers.host || 'tmsavannah.com';

  if (!shopId) {
    return res.status(400).json({ error: "Missing required query parameter: shopId" });
  }

  if (action !== 'sync' && action !== 'status') {
    return res.status(400).json({ error: "Invalid action. Must be 'sync' or 'status'." });
  }

  try {
    // 1. Fetch the Shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*, id:shop_id')
      .eq('shop_id', shopId)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: `Shop not found: ${shopError?.message || ''}` });
    }

    const merchantId = shop.google_merchant_id;
    if (!merchantId) {
      return res.status(400).json({ error: "Google Merchant ID is not configured for this shop." });
    }

    // 2. Authenticate with Google
    const token = await getAccessToken();

    // === ACTION: STATUS ===
    if (action === 'status') {
      const gRes = await fetch(`https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/productstatuses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!gRes.ok) {
        const errorText = await gRes.text();
        return res.status(gRes.status).json({ error: `Google API Error: ${errorText}` });
      }

      const statusData = await gRes.json();
      
      let approvedCount = 0;
      let pendingCount = 0;
      let disapprovedCount = 0;
      const issues = [];
      const seenIssues = new Set();

      if (statusData.resources && statusData.resources.length > 0) {
        statusData.resources.forEach(item => {
          let hasDisapproval = false;
          let hasPending = false;

          if (item.destinationStatuses) {
            item.destinationStatuses.forEach(dest => {
              if (dest.status === 'disapproved') hasDisapproval = true;
              if (dest.status === 'pending') hasPending = true;
            });
          }

          if (hasDisapproval) disapprovedCount++;
          else if (hasPending) pendingCount++;
          else approvedCount++;

          if (item.itemLevelIssues) {
            item.itemLevelIssues.forEach(issue => {
              const key = `${issue.code}:${issue.description}`;
              if (!seenIssues.has(key)) {
                seenIssues.add(key);
                issues.push({
                  code: issue.code,
                  description: issue.description,
                  detail: issue.detail || '',
                  resolution: issue.resolution || '',
                  affectedItems: 1
                });
              } else {
                const existing = issues.find(i => i.code === issue.code && i.description === issue.description);
                if (existing) existing.affectedItems++;
              }
            });
          }
        });
      }

      return res.status(200).json({
        success: true,
        approved: approvedCount,
        pending: pendingCount,
        disapproved: disapprovedCount,
        issues
      });
    }

    // === ACTION: SYNC ===
    if (action === 'sync') {
      // Fetch active menu items
      const { data: rawItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', shopId);

      if (itemsError) {
        throw new Error(`Database error fetching products: ${itemsError.message}`);
      }

      if (!rawItems || rawItems.length === 0) {
        return res.status(200).json({ success: true, message: "No products to sync." });
      }

      // Filter out items with invalid prices (<=0) and inactive items
      const items = rawItems.filter(item => {
        const price = parseFloat(item.price || 0);
        return price > 0 && item.is_active !== false;
      });

      if (items.length === 0) {
        return res.status(200).json({ success: true, message: "No valid products to sync (all items have price 0 or are inactive)." });
      }

      const skippedCount = rawItems.length - items.length;

      const entries = items.map((item, index) => {
        const itemSku = item.sku || item.id;
        const productSlug = slugify(item.name);
        const itemLink = toAbsoluteUrl(`/product/${productSlug}/${item.id}`, host);
        
        let imgUrl = '';
        if (item.product_images && item.product_images.length > 0) {
          imgUrl = item.product_images[0].url;
        } else if (item.image_url) {
          imgUrl = item.image_url;
        }
        const absoluteImgUrl = imgUrl ? toAbsoluteUrl(imgUrl, host) : toAbsoluteUrl('/flax-seeds.png', host);

        // Resolve Google-compliant product category
        const googleCategory = resolveGoogleCategory(item);

        // Resolve shipping weight
        const weight = parseShippingWeight(item);

        return {
          batchId: index,
          merchantId: merchantId,
          method: "insert",
          productId: `online:en:KE:${itemSku}`,
          product: {
            offerId: itemSku,
            title: item.name,
            description: item.description || `${item.name} from ${shop.name}`,
            link: itemLink,
            imageLink: absoluteImgUrl,
            contentLanguage: "en",
            targetCountry: "KE",
            feedLabel: "KE",
            channel: "online",
            availability: item.stock === 0 ? "out of stock" : "in stock",
            condition: item.attributes?.condition || "new",
            price: {
              value: parseFloat(item.price).toFixed(2),
              currency: "KES"
            },
            brand: item.attributes?.brand || item.brand || shop.name,
            gtin: item.attributes?.gtin || undefined,
            mpn: itemSku,
            googleProductCategory: googleCategory,
            shippingWeight: {
              value: weight.value,
              unit: weight.unit
            }
          }
        };
      });

      const batchPayload = { entries };

      const batchRes = await fetch(`https://shoppingcontent.googleapis.com/content/v2.1/products/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchPayload)
      });

      const batchData = await batchRes.json();
      
      let hasErrors = false;
      let errorMessages = [];
      
      if (batchData.entries) {
        batchData.entries.forEach(entry => {
          if (entry.errors) {
            hasErrors = true;
            entry.errors.errors.forEach(err => errorMessages.push(err.message));
          }
        });
      }

      const statusText = hasErrors 
        ? `Sync warning: ${errorMessages.slice(0, 3).join(', ')}`
        : `Synced ${items.length} products successfully.${skippedCount > 0 ? ` (${skippedCount} skipped: invalid price or inactive)` : ''}`;

      // Update Database
      await supabase
        .from('shops')
        .update({
          google_last_sync_at: new Date().toISOString(),
          google_sync_status: statusText
        })
        .eq('shop_id', shopId);

      return res.status(200).json({
        success: !hasErrors,
        message: statusText,
        details: batchData
      });
    }

  } catch (err) {
    console.error("Google Merchant API Exception:", err);
    // Update DB with exception
    try {
      await supabase
        .from('shops')
        .update({
          google_sync_status: `Failed: ${err.message}`
        })
        .eq('shop_id', shopId);
    } catch (dbErr) {
      console.error("Failed to log sync exception to DB:", dbErr);
    }

    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
