import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'Book2.xlsx');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
);

const SHOP_ID = 'deada001-1111-4444-8888-deada0016666';

async function importData() {
  try {
    // 1. Delete previous test imports
    console.log('Cleaning up previous test imports...');
    const { error: deleteErr } = await supabase
      .from('menu_items')
      .delete()
      .eq('shop_id', SHOP_ID)
      .like('image_url', '%unsplash.com/photo-1542838132-92c53300491e%');
    
    if (deleteErr) console.warn('Cleanup warning:', deleteErr);

    // 2. Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[1]; // Sheet 2
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    console.log(`Found ${data.length} products to import.`);

    const menuItems = data.map(item => {
      // Standardized Attribute Mapping
      const attributes = {
        weight: item['Size'] || null,
        origin: item['Origin'] || null,
        benefits: item['Benefits'] || null,
        processing: item['Processing'] || null,
        nutrition: item['Nutrition'] || null,
        brand: item['Brand'] || null,
        packaging: item['Packaging'] || null,
        recipe: item['Recipe'] || null,
        usage: item['Usage'] || null
      };

      return {
        shop_id: SHOP_ID,
        name: item['Product Name'],
        price: parseFloat(item['Unit Price']) || 0,
        category: item['Category'] || 'General',
        description: item['Short Description'] || '',
        sku: item['SKU'] || null,
        is_active: true,
        attributes: attributes,
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
      };
    });

    const { data: inserted, error } = await supabase
      .from('menu_items')
      .insert(menuItems)
      .select();

    if (error) throw error;

    console.log(`Successfully re-imported ${inserted.length} products with standardized schema.`);
  } catch (error) {
    console.error('Import Error:', error);
  }
}

importData();
