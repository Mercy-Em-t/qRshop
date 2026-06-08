import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  const { data: shops, error: shopErr } = await supabase
    .from('shops')
    .select('name, slug, subdomain, id, google_merchant_id');

  if (shopErr) {
    console.error("Error fetching shops:", shopErr);
    return;
  }
  
  console.log("SHOPS:");
  console.log(JSON.stringify(shops, null, 2));

  for (const shop of shops) {
    if (shop.google_merchant_id) {
      console.log(`\nFetching items for shop ${shop.name} (${shop.id}):`);
      const { data: items, error: itemsErr } = await supabase
        .from('menu_items')
        .select('id, name, category, price, is_active, attributes')
        .eq('shop_id', shop.id);
      
      if (itemsErr) {
        console.error("Error items:", itemsErr);
        continue;
      }
      
      console.log(`Total items in DB: ${items?.length}`);
      
      const invalidGoogleCategories = [];

      items?.forEach(item => {
        const price = parseFloat(item.price || 0);
        const active = item.is_active !== false;
        
        const googleCategoryId = item.attributes?.google_product_category_id;

        if (price > 0 && active) {
          if (!googleCategoryId) {
            invalidGoogleCategories.push({
              name: item.name,
              category: item.category,
              attributes: item.attributes
            });
          }
        }
      });

      console.log(`Valid active items: ${items?.filter(i => parseFloat(i.price) > 0 && i.is_active !== false).length}`);
      console.log(`Items missing google_product_category_id: ${invalidGoogleCategories.length}`);
      console.log("First 5 missing/invalid items:", invalidGoogleCategories.slice(0, 5));
    }
  }
}

run();
