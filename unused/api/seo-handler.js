import { createClient } from '@supabase/supabase-js';

// Enforce standard length constraints for search crawlers
const truncate = (str, max) => {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.substring(0, max - 3) + "...";
};

// Escape HTML utility to prevent parameter breakages or XSS injections
function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Resolves a shop's database entry using UUID, slug, subdomain, or redirection mappings.
 */
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
    console.error("SEO Resolver Shop DB Error:", error);
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

/**
 * Resolves a product and joins its shop details.
 */
async function resolveProduct(productId) {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, shops(*)")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("SEO Resolver Product DB Error:", error);
    return null;
  }
  return data;
}

export default async function handler(req, res) {
  const { query, headers } = req;
  const type = query.type || 'shop';
  const id = query.id;

  if (!id) {
    return res.status(400).send("Bad Request: Target Identifier 'id' is required.");
  }

  try {
    let title = "The Modern Savannah";
    let description = "Order from top-tier storefronts and track deliveries instantly.";
    let ogImage = "";
    let jsonLd = null;
    let targetUrl = `https://${headers.host}${req.url}`;

    // 1. Fetch Dynamic DB SEO Configurations
    if (type === 'product') {
      const product = await resolveProduct(id);
      if (product) {
        const shopName = product.shops?.name || "Savannah Store";
        title = truncate(`Buy ${product.name} | ${shopName}`, 60);
        description = truncate(product.description || `Order ${product.name} online at ${shopName}.`, 160);
        
        const images = (product.product_images && product.product_images.length > 0)
          ? product.product_images.map(img => img.url)
          : (product.image_url ? [product.image_url] : []);
        
        if (images.length > 0) {
          ogImage = images[0];
        }

        // Build Product JSON-LD schema
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": images,
          "description": description,
          "brand": {
            "@type": "Brand",
            "name": shopName
          },
          "offers": {
            "@type": "Offer",
            "url": targetUrl,
            "priceCurrency": "KES",
            "price": product.price,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        };
      }
    } else {
      // Default: Shop Profile SEO
      const shop = await resolveShop(id);
      if (shop) {
        const shopIdStr = shop.shop_id || shop.id;
        
        // Fetch customized SEO schemas from google_metadata table
        const { data: seoConfig } = await supabase
          .from("google_metadata")
          .select("json_ld")
          .eq("target_type", "shop")
          .eq("target_id", shopIdStr)
          .maybeSingle();

        if (seoConfig && seoConfig.json_ld) {
          const ld = seoConfig.json_ld;
          title = truncate(ld.name ? `${ld.name} | ${shop.name}` : `${shop.name} | ${shop.tagline || 'Shop'}`, 60);
          description = truncate(ld.description || shop.tagline || `Browse ${shop.name} and order online.`, 160);
          jsonLd = ld;
        } else {
          title = truncate(`${shop.name} | ${shop.tagline || 'Shop Online'}`, 60);
          description = truncate(shop.tagline || `Welcome to ${shop.name}. Browse products and order online.`, 160);
        }

        if (shop.logo_url) {
          ogImage = shop.logo_url;
        }
      }
    }

    // 2. Fetch the Live built React HTML template from Edge host
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers.host;
    const origin = `${protocol}://${host}`;

    const templateResponse = await fetch(`${origin}/index.html`);
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch main index template from ${origin}`);
    }
    let html = await templateResponse.text();

    // 3. Clear existing conflicting meta elements in index template to prevent duplicate headers
    html = html.replace(/<title>.*?<\/title>/gi, '');
    html = html.replace(/<meta[^>]*name="description"[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*property="og:title"[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*property="og:description"[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*property="og:image"[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*property="og:url"[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*name="twitter:card"[^>]*>/gi, '');

    // 4. Inject Dynamic and validated Crawler tags into Head
    const headInsert = `<head>
  <meta name="google-site-verification" content="8PqqCjinXfqssxrn-cV5CE7MugR211pwBjNOh0xCfMg" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
  <meta property="og:url" content="${escapeHtml(targetUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  ${jsonLd ? `<script type="application/ld+json" id="savannah-json-ld">${JSON.stringify(jsonLd)}</script>` : ''}`;

    html = html.replace(/<head[^>]*>/i, headInsert);

    // 5. Send optimized HTML payload
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // cache at edge for maximum performance
    return res.status(200).send(html);

  } catch (err) {
    console.error("SEO Prerender Exception:", err);
    return res.status(502).send(`Bad Gateway: Failed to parse search layout. ${err.message}`);
  }
}
