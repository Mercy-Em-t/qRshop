-- MAMAROSY HEALTH GROCERY: FULL PROVISIONING & INFRASTRUCTURE
-- Idempotent provisioning for ShopQR Ecosystem

DO $$ 
DECLARE 
    mamarosy_id UUID := 'deada001-1111-4444-8888-deada0016666'::uuid;
    owner_id UUID;
BEGIN
    -- 1. ENSURE INDUSTRY TAXONOMY
    INSERT INTO public.industry_types (slug, name, description) VALUES
    ('grocery', 'Grocery & Essentials', 'Supermarkets, organic markets, and grocery nodes'),
    ('organic_health', 'Health & Organic', 'Natural products, health supplements, and organic food')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. CREATE CATEGORIES TABLE (If missing)
    -- This addresses the "categories list" requirement for better management
    CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(shop_id, name)
    );

    -- 3. PROVISION SHOP: MAMAROSY
    INSERT INTO public.shops (id, name, subdomain, industry_type, plan, subscription_expires_at, is_online)
    VALUES (
        mamarosy_id, 
        'Mamarosy Health Grocery', 
        'mamarosy', 
        'grocery', 
        'pro',
        now() + interval '1 year',
        true
    ) ON CONFLICT (id) DO UPDATE SET 
        industry_type = EXCLUDED.industry_type,
        plan = EXCLUDED.plan,
        subscription_expires_at = EXCLUDED.subscription_expires_at;

    -- 3.1 LINK OWNER (if user exists)
    SELECT id INTO owner_id FROM auth.users WHERE email = 'mamarosy@shopqr.ke' LIMIT 1;
    IF owner_id IS NOT NULL THEN
        INSERT INTO public.shop_users (id, shop_id, email, role)
        VALUES (owner_id, mamarosy_id, 'mamarosy@shopqr.ke', 'owner')
        ON CONFLICT (id) DO UPDATE SET shop_id = EXCLUDED.shop_id;
    END IF;

    -- 4. SEED PRODUCT CATEGORIES
    INSERT INTO public.categories (shop_id, name) VALUES
    (mamarosy_id, 'Cereals & Grains'),
    (mamarosy_id, 'Pulses & Legumes'),
    (mamarosy_id, 'Nuts & Nut Products'),
    (mamarosy_id, 'Seeds'),
    (mamarosy_id, 'Spices & Seasonings'),
    (mamarosy_id, 'Natural Sweeteners & Additives'),
    (mamarosy_id, 'Flour & Milling Products'),
    (mamarosy_id, 'Snacks (Natural)'),
    (mamarosy_id, 'Beverages'),
    (mamarosy_id, 'Dried Fruits'),
    (mamarosy_id, 'Cooking Essentials'),
    (mamarosy_id, 'Ready-to-Eat / Convenience')
    ON CONFLICT (shop_id, name) DO NOTHING;

        -- 5. SEED PRODUCTS (Full 100+ Item Supermarket Catalog)
    -- Grouped by the Official Mamarosy Taxonomy
    INSERT INTO public.menu_items (shop_id, name, description, price, category, sku, stock, is_active)
    VALUES 
    -- Cereals & Grains
    (mamarosy_id, 'Maize (whole)', 'High-quality whole maize grains for milling.', 120, 'Cereals & Grains', 'CR-MZ-01', 500, true),
    (mamarosy_id, 'Maize flour (unga ya ugali)', 'Finely milled maize flour for traditional ugali.', 150, 'Cereals & Grains', 'CR-MZ-02', 300, true),
    (mamarosy_id, 'Wheat grains', 'Whole wheat grains for home milling.', 180, 'Cereals & Grains', 'CR-WH-01', 200, true),
    (mamarosy_id, 'Wheat flour (all-purpose)', 'Premium all-purpose wheat flour.', 160, 'Cereals & Grains', 'CR-WH-02', 250, true),
    (mamarosy_id, 'Brown rice', 'Organic long-grain brown rice - high fiber.', 420, 'Cereals & Grains', 'CR-RC-01', 150, true),
    (mamarosy_id, 'White rice', 'Polished premium long-grain white rice.', 280, 'Cereals & Grains', 'CR-RC-02', 150, true),
    (mamarosy_id, 'Basmati rice', 'Fragrant premium Basmati rice.', 450, 'Cereals & Grains', 'CR-RC-03', 100, true),
    (mamarosy_id, 'Pishori rice', 'Pure Mwea Pishori rice - aromatic.', 480, 'Cereals & Grains', 'CR-RC-04', 100, true),
    (mamarosy_id, 'Millet (wimbi)', 'Nutritious pearl millet grains.', 380, 'Cereals & Grains', 'CR-ML-01', 100, true),
    (mamarosy_id, 'Sorghum (mtama)', 'Organic whole sorghum grains.', 350, 'Cereals & Grains', 'CR-SR-01', 100, true),
    (mamarosy_id, 'Oats (rolled oats)', 'Premium rolled oats for hearty breakfast.', 550, 'Cereals & Grains', 'CR-OT-01', 80, true),
    (mamarosy_id, 'Instant oats', 'Quick-cooking instant oats.', 500, 'Cereals & Grains', 'CR-OT-02', 80, true),
    (mamarosy_id, 'Barley', 'Whole barley grains for soups and stews.', 320, 'Cereals & Grains', 'CR-BR-01', 50, true),
    (mamarosy_id, 'Quinoa', 'Protein-rich organic quinoa.', 1200, 'Cereals & Grains', 'CR-QN-01', 50, true),
    (mamarosy_id, 'Amaranth (terere seeds)', 'Nutrient-dense amaranth seeds.', 600, 'Cereals & Grains', 'CR-AM-01', 50, true),
    (mamarosy_id, 'Semolina', 'Coarse durum wheat semolina.', 220, 'Cereals & Grains', 'CR-SM-01', 100, true),
    (mamarosy_id, 'Cornflakes', 'Classic breakfast cereal.', 400, 'Cereals & Grains', 'CR-BC-01', 50, true),
    (mamarosy_id, 'Breakfast muesli', 'Mixed grains, nuts, and dried fruits.', 750, 'Cereals & Grains', 'CR-BC-02', 50, true),
    (mamarosy_id, 'Granola mix', 'Honey-baked granola with seeds.', 800, 'Cereals & Grains', 'CR-BC-03', 50, true),
    (mamarosy_id, 'Porridge flour mix', 'Multi-grain blend for nutritious porridge.', 350, 'Cereals & Grains', 'CR-PF-01', 100, true),

    -- Pulses & Legumes
    (mamarosy_id, 'Yellow beans', 'Premium quality yellow beans.', 210, 'Pulses & Legumes', 'PL-BN-01', 300, true),
    (mamarosy_id, 'Red beans', 'Organic red kidney beans.', 220, 'Pulses & Legumes', 'PL-BN-02', 300, true),
    (mamarosy_id, 'Kidney beans', 'Cleaned red kidney beans.', 220, 'Pulses & Legumes', 'PL-BN-03', 300, true),
    (mamarosy_id, 'Rose coco beans', 'Popular speckled Rose Coco beans.', 230, 'Pulses & Legumes', 'PL-BN-04', 300, true),
    (mamarosy_id, 'Green grams (ndengu)', 'Polished green grams (Makueni Type).', 240, 'Pulses & Legumes', 'PL-LG-01', 250, true),
    (mamarosy_id, 'Chickpeas', 'Dried whole chickpeas (Garbanzo).', 420, 'Pulses & Legumes', 'PL-LG-02', 200, true),
    (mamarosy_id, 'Lentils (red)', 'Split red lentils - quick cooking.', 400, 'Pulses & Legumes', 'PL-LG-03', 200, true),
    (mamarosy_id, 'Lentils (green)', 'Whole green lentils.', 380, 'Pulses & Legumes', 'PL-LG-04', 200, true),
    (mamarosy_id, 'Black beans', 'Rich, earthy black beans.', 390, 'Pulses & Legumes', 'PL-BN-05', 200, true),
    (mamarosy_id, 'Cowpeas', 'Nutritious whole cowpeas.', 210, 'Pulses & Legumes', 'PL-LG-05', 150, true),
    (mamarosy_id, 'Pigeon peas (mbaazi)', 'Whole pigeon peas.', 220, 'Pulses & Legumes', 'PL-LG-06', 150, true),
    (mamarosy_id, 'Soya beans', 'High-protein whole soya beans.', 250, 'Pulses & Legumes', 'PL-LG-07', 150, true),
    (mamarosy_id, 'Split peas', 'Dried split yellow/green peas.', 240, 'Pulses & Legumes', 'PL-LG-08', 150, true),

    -- Nuts & Nut Products
    (mamarosy_id, 'Groundnuts (raw)', 'Organic raw peanuts.', 150, 'Nuts & Nut Products', 'NT-GN-01', 300, true),
    (mamarosy_id, 'Groundnuts (roasted)', 'Salt-roasted peanuts.', 180, 'Nuts & Nut Products', 'NT-GN-02', 300, true),
    (mamarosy_id, 'Cashew nuts', 'Premium roasted cashews.', 1100, 'Nuts & Nut Products', 'NT-CS-01', 100, true),
    (mamarosy_id, 'Almonds', 'Whole raw almonds.', 1500, 'Nuts & Nut Products', 'NT-AL-01', 100, true),
    (mamarosy_id, 'Walnuts', 'Brain-healthy raw walnuts.', 1800, 'Nuts & Nut Products', 'NT-WL-01', 50, true),
    (mamarosy_id, 'Macadamia nuts', 'Kenyan premium macadamia.', 850, 'Nuts & Nut Products', 'NT-MC-01', 100, true),
    (mamarosy_id, 'Hazelnuts', 'Whole raw hazelnuts.', 1600, 'Nuts & Nut Products', 'NT-HZ-01', 50, true),
    (mamarosy_id, 'Pistachios', 'Salted in-shell pistachios.', 2200, 'Nuts & Nut Products', 'NT-PS-01', 50, true),
    (mamarosy_id, 'Peanut butter (smooth)', 'Natural pure peanut butter.', 350, 'Nuts & Nut Products', 'NT-PB-01', 100, true),
    (mamarosy_id, 'Peanut butter (crunchy)', 'Crunchy natural peanut butter.', 350, 'Nuts & Nut Products', 'NT-PB-02', 100, true),
    (mamarosy_id, 'Almond butter', 'Creamy raw almond butter.', 1200, 'Nuts & Nut Products', 'NT-AB-01', 50, true),
    (mamarosy_id, 'Mixed nuts pack', 'Assorted nuts and seeds.', 950, 'Nuts & Nut Products', 'NT-MX-01', 80, true),

    -- Seeds
    (mamarosy_id, 'Chia seeds', 'Omega-3 rich black chia seeds.', 600, 'Seeds', 'SD-CH-01', 100, true),
    (mamarosy_id, 'Flax seeds', 'Whole golden flax seeds.', 450, 'Seeds', 'SD-FX-01', 100, true),
    (mamarosy_id, 'Pumpkin seeds', 'Roasted pumpkin seed kernels.', 850, 'Seeds', 'SD-PK-01', 100, true),
    (mamarosy_id, 'Sunflower seeds', 'Hulled sunflower seeds.', 400, 'Seeds', 'SD-SF-01', 100, true),
    (mamarosy_id, 'Sesame seeds (white)', 'Cleaned white sesame.', 350, 'Seeds', 'SD-SS-01', 100, true),
    (mamarosy_id, 'Sesame seeds (black)', 'Organic black sesame.', 400, 'Seeds', 'SD-SS-02', 50, true),
    (mamarosy_id, 'Hemp seeds', 'Hulled organic hemp hearts.', 1500, 'Seeds', 'SD-HM-01', 50, true),
    (mamarosy_id, 'Poppy seeds', 'Blue poppy seeds.', 900, 'Seeds', 'SD-PP-01', 50, true),
    (mamarosy_id, 'Basil seeds (sabja)', 'Natural cooling basil seeds.', 450, 'Seeds', 'SD-BS-01', 50, true),
    (mamarosy_id, 'Mixed seed blend', 'Chia, flax, and pumpkin mix.', 750, 'Seeds', 'SD-MX-01', 80, true),

    -- Spices & Seasonings
    (mamarosy_id, 'Black pepper', 'Whole black peppercorns.', 400, 'Spices & Seasonings', 'SP-BP-01', 100, true),
    (mamarosy_id, 'White pepper', 'Whole white peppercorns.', 550, 'Spices & Seasonings', 'SP-WP-01', 50, true),
    (mamarosy_id, 'Turmeric powder', 'Pure organic turmeric.', 320, 'Spices & Seasonings', 'SP-TM-01', 150, true),
    (mamarosy_id, 'Curry powder', 'Mombasa-style aromatic curry.', 250, 'Spices & Seasonings', 'SP-CP-01', 200, true),
    (mamarosy_id, 'Paprika', 'Sweet ground paprika.', 300, 'Spices & Seasonings', 'SP-PP-01', 100, true),
    (mamarosy_id, 'Chili powder', 'Extra hot chili powder.', 220, 'Spices & Seasonings', 'SP-CH-01', 150, true),
    (mamarosy_id, 'Cayenne pepper', 'Hot ground cayenne.', 350, 'Spices & Seasonings', 'SP-CY-01', 100, true),
    (mamarosy_id, 'Cinnamon sticks', 'True Ceylon cinnamon sticks.', 450, 'Spices & Seasonings', 'SP-CN-01', 80, true),
    (mamarosy_id, 'Cinnamon powder', 'Ground aromatic cinnamon.', 280, 'Spices & Seasonings', 'SP-CN-02', 150, true),
    (mamarosy_id, 'Cloves', 'Whole Zanzibar cloves.', 600, 'Spices & Seasonings', 'SP-CL-01', 50, true),
    (mamarosy_id, 'Cardamom pods', 'Whole green cardamom.', 1200, 'Spices & Seasonings', 'SP-CR-01', 50, true),
    (mamarosy_id, 'Cumin seeds', 'Whole earthy cumin seeds.', 380, 'Spices & Seasonings', 'SP-CM-01', 100, true),
    (mamarosy_id, 'Coriander seeds', 'Whole dried coriander.', 220, 'Spices & Seasonings', 'SP-CR-02', 100, true),
    (mamarosy_id, 'Garam masala', 'Indian-style spice blend.', 400, 'Spices & Seasonings', 'SP-GM-01', 100, true),
    (mamarosy_id, 'Mixed herbs', 'Dried basil, oregano, thyme.', 350, 'Spices & Seasonings', 'SP-HB-01', 100, true),
    (mamarosy_id, 'Bay leaves', 'Dried aromatic bay leaves.', 150, 'Spices & Seasonings', 'SP-BL-01', 50, true),
    (mamarosy_id, 'Ginger powder', 'Dried ground ginger root.', 320, 'Spices & Seasonings', 'SP-GG-01', 150, true),
    (mamarosy_id, 'Garlic powder', 'Dehydrated garlic powder.', 300, 'Spices & Seasonings', 'SP-GL-01', 150, true),
    (mamarosy_id, 'Onion powder', 'Dehydrated onion powder.', 280, 'Spices & Seasonings', 'SP-ON-01', 150, true),
    (mamarosy_id, 'Salt (table)', 'Fine iodized table salt.', 50, 'Spices & Seasonings', 'SP-SL-01', 500, true),
    (mamarosy_id, 'Sea salt', 'Coarse natural sea salt.', 150, 'Spices & Seasonings', 'SP-SL-02', 200, true),
    (mamarosy_id, 'Himalayan pink salt', 'Mineral-rich pink salt.', 180, 'Spices & Seasonings', 'SP-SL-03', 200, true),

    -- Natural Sweeteners & Additives
    (mamarosy_id, 'Honey (raw)', 'Unprocessed wild honey.', 850, 'Natural Sweeteners & Additives', 'SW-HN-01', 100, true),
    (mamarosy_id, 'Honey (processed)', 'Filtered clear honey.', 650, 'Natural Sweeteners & Additives', 'SW-HN-02', 100, true),
    (mamarosy_id, 'Molasses', 'Thick dark sugarcane molasses.', 450, 'Natural Sweeteners & Additives', 'SW-ML-01', 50, true),
    (mamarosy_id, 'Jaggery', 'Unrefined cane sugar blocks.', 180, 'Natural Sweeteners & Additives', 'SW-JG-01', 100, true),
    (mamarosy_id, 'Brown sugar', 'Natural brown sugar.', 220, 'Natural Sweeteners & Additives', 'SW-SG-01', 300, true),
    (mamarosy_id, 'White sugar', 'Pure white sugar.', 180, 'Natural Sweeteners & Additives', 'SW-SG-02', 300, true),
    (mamarosy_id, 'Icing sugar', 'Finely ground sugar.', 250, 'Natural Sweeteners & Additives', 'SW-SG-03', 100, true),
    (mamarosy_id, 'Maple syrup (imported niche)', 'Pure Canadian maple syrup.', 1800, 'Natural Sweeteners & Additives', 'SW-MS-01', 20, true),
    (mamarosy_id, 'Date syrup', 'Natural sweetener from dates.', 750, 'Natural Sweeteners & Additives', 'SW-DS-01', 50, true),

    -- Herbal Teas & Drinks
    (mamarosy_id, 'Green tea', 'Antioxidant-rich green tea.', 450, 'Beverages', 'BV-TE-01', 100, true),
    (mamarosy_id, 'Black tea', 'Locally grown premium black tea.', 300, 'Beverages', 'BV-TE-02', 200, true),
    (mamarosy_id, 'Chamomile tea', 'Calming herbal tea.', 550, 'Beverages', 'BV-TE-03', 80, true),
    (mamarosy_id, 'Hibiscus tea', 'Dried hibiscus petals.', 350, 'Beverages', 'BV-TE-04', 100, true),
    (mamarosy_id, 'Ginger tea', 'Spicy warming ginger tea.', 400, 'Beverages', 'BV-TE-05', 100, true),
    (mamarosy_id, 'Lemon tea', 'Refreshing lemon-infused tea.', 380, 'Beverages', 'BV-TE-06', 100, true),
    (mamarosy_id, 'Detox tea blends', 'Specialized herbal detox mix.', 750, 'Beverages', 'BV-TE-07', 50, true),
    (mamarosy_id, 'Matcha powder', 'Ceremonial grade matcha.', 2500, 'Beverages', 'BV-MC-01', 30, true),

    -- Dried Fruits
    (mamarosy_id, 'Raisins', 'Dried seedless grapes.', 350, 'Dried Fruits', 'DF-RS-01', 150, true),
    (mamarosy_id, 'Sultanas', 'Gold sultana raisins.', 380, 'Dried Fruits', 'DF-RS-02', 150, true),
    (mamarosy_id, 'Dates', 'Premium Saudi dates.', 850, 'Dried Fruits', 'DF-DT-01', 200, true),
    (mamarosy_id, 'Dried apricots', 'Sweet dried apricots.', 750, 'Dried Fruits', 'DF-AP-01', 100, true),
    (mamarosy_id, 'Dried mango', 'Sulphur-free dried mango.', 280, 'Dried Fruits', 'DF-MG-01', 150, true),
    (mamarosy_id, 'Dried pineapple', 'Dried organic pineapple.', 320, 'Dried Fruits', 'DF-PN-01', 100, true),
    (mamarosy_id, 'Dried bananas', 'Naturally sweet dried bananas.', 250, 'Dried Fruits', 'DF-BN-01', 100, true),
    (mamarosy_id, 'Prunes', 'Dried digestion-friendly prunes.', 650, 'Dried Fruits', 'DF-PR-01', 80, true),
    (mamarosy_id, 'Cranberries', 'Dried sweetened cranberries.', 950, 'Dried Fruits', 'DF-CB-01', 80, true),

    -- Cooking Essentials
    (mamarosy_id, 'Cooking oil (sunflower)', 'Pure sunflower oil.', 430, 'Cooking Essentials', 'CE-OL-01', 200, true),
    (mamarosy_id, 'Cooking oil (vegetable)', 'Refined vegetable oil.', 380, 'Cooking Essentials', 'CE-OL-02', 200, true),
    (mamarosy_id, 'Olive oil', 'Extra virgin olive oil.', 1200, 'Cooking Essentials', 'CE-OL-03', 100, true),
    (mamarosy_id, 'Coconut oil', 'Cold-pressed virgin coconut oil.', 950, 'Cooking Essentials', 'CE-OL-04', 100, true),
    (mamarosy_id, 'Vinegar (white)', 'Distilled white vinegar.', 120, 'Cooking Essentials', 'CE-CD-01', 150, true),
    (mamarosy_id, 'Apple cider vinegar', 'With "The Mother" organic ACV.', 850, 'Cooking Essentials', 'CE-CD-02', 100, true),
    (mamarosy_id, 'Soy sauce', 'Premium dark soy sauce.', 250, 'Cooking Essentials', 'CE-CD-03', 100, true),
    (mamarosy_id, 'Baking powder', 'Action-level baking powder.', 150, 'Cooking Essentials', 'CE-BK-01', 150, true),
    (mamarosy_id, 'Baking soda', 'Food-grade bicarbonate of soda.', 100, 'Cooking Essentials', 'CE-BK-02', 150, true),
    (mamarosy_id, 'Yeast', 'Instant dry yeast.', 280, 'Cooking Essentials', 'CE-BK-03', 100, true),

    -- Ready-to-Eat / Convenience
    (mamarosy_id, 'Instant noodles', 'Masala flavor instant noodles.', 50, 'Ready-to-Eat / Convenience', 'RE-CN-01', 500, true),
    (mamarosy_id, 'Ready porridge mix', 'Just-add-water nutritious mix.', 450, 'Ready-to-Eat / Convenience', 'RE-CN-02', 100, true),
    (mamarosy_id, 'Energy bars', 'Oat and honey energy bars.', 120, 'Ready-to-Eat / Convenience', 'RE-CN-03', 200, true),
    (mamarosy_id, 'Protein bars', 'High-protein chocolate bars.', 250, 'Ready-to-Eat / Convenience', 'RE-CN-04', 100, true),
    (mamarosy_id, 'Breakfast biscuits', 'Whole grain breakfast biscuits.', 180, 'Ready-to-Eat / Convenience', 'RE-CN-05', 150, true),
    (mamarosy_id, 'Instant soup mix', 'Assorted vegetable soups.', 60, 'Ready-to-Eat / Convenience', 'RE-CN-06', 200, true)
    ON CONFLICT DO NOTHING;

    -- 6. ORDER NOTIFICATION AUDIT TABLE (Centralized Logs)
    CREATE TABLE IF NOT EXISTS public.order_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_customer_name TEXT,
        order_id UUID REFERENCES public.orders(id), -- FIXED reference to orders
        shop_id UUID REFERENCES public.shops(id),
        notification_type TEXT,
        channel TEXT DEFAULT 'whatsapp',
        status TEXT DEFAULT 'sent',
        payload JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
    );

END $$;
