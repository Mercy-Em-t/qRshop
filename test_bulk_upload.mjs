import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  console.log("Running comprehensive upload test...");

  // 1. Resolve a valid SHOP_ID
  const { data: shops, error: shopsErr } = await supabase.from("shops").select("shop_id").limit(1);
  if (shopsErr) throw shopsErr;
  if (!shops || shops.length === 0) throw new Error("No shops available");

  const SHOP_ID = shops[0].shop_id;
  console.log(`Using SHOP_ID: ${SHOP_ID}`);

  // 2. Insert a sample product
  const { data: products, error: prodErr } = await supabase
    .from("menu_items")
    .insert({
       shop_id: SHOP_ID,
       name: "Test Smart Watch",
       price: 49.99,
       is_active: true,
       category: "Main",
       description: "Auto-created from test script."
    })
    .select();

  if (prodErr) throw prodErr;
  if (!products || products.length === 0) throw new Error("Could not create product row");

  const productId = products[0].id;
  console.log(`Created test product with ID: ${productId}`);

  // 3. Prepare the file
  const testImagePath = path.resolve("C:/Users/LIZBETH/.gemini/antigravity/brain/5e9d291d-cd6e-48a7-adb3-fdc1f60c3686/sample_product_1777655391666.png");
  if (!fs.existsSync(testImagePath)) {
     throw new Error(`Test image file not found at path: ${testImagePath}`);
  }

  const fileBuffer = fs.readFileSync(testImagePath);
  const fileName = `${SHOP_ID}/${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`;

  console.log(`Uploading test image file buffer to storage... Target name: ${fileName}`);

  // 4. Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, fileBuffer, { contentType: "image/png" });

  if (uploadError) {
     console.error("Storage upload failed:", uploadError);
     throw uploadError;
  }

  console.log("Storage upload successful.");

  // 5. Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  const publicUrl = publicUrlData.publicUrl;
  console.log(`Public URL: ${publicUrl}`);

  // 6. Map to Database
  const { error: imgInsertErr } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrl,
    position: 0
  });
  if (imgInsertErr) throw imgInsertErr;
  console.log("Linked URL to product_images table successfully.");

  const { error: itemUpdateErr } = await supabase.from("menu_items").update({ image_url: publicUrl }).eq("id", productId);
  if (itemUpdateErr) throw itemUpdateErr;
  console.log("Updated thumbnail on menu_items successfully.");

  console.log("\n==========================================");
  console.log("🎉 SUCCESS! All steps of the process completed perfectly.");
  console.log("==========================================");
}

runTest().catch(err => {
  console.error("❌ Test failed:", err);
});
