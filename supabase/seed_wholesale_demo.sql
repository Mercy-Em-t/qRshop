-- SEED DATA: 5 Products per 5 Categories for Wholesale Demo
-- Targeted Shop ID: d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882

-- Ensure shop exists (if not already)
INSERT INTO shops (id, name, industry_type, plan)
VALUES ('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Global Wholesale Craft Supplies', 'Retail', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Seed Menu Items (metadata column removed; MOQ info included in description)
INSERT INTO menu_items (shop_id, name, description, price, category, is_active)
VALUES
-- YARNS
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Premium Wool Mixed', 'Soft blended wool for bulky knitting. MOQ: 10kg', 25.00, 'Yarns', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Egyptian Cotton Yarn', 'High-quality natural cotton. MOQ: 20kg', 30.00, 'Yarns', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Synthetic Acrylic Yarn', 'Vibrant colors, durable. MOQ: 50kg', 15.00, 'Yarns', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Bamboo Fiber Yarn', 'Eco-friendly, breathable. MOQ: 10kg', 35.00, 'Yarns', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Merino Luxury Wool', 'The finest wool for premium projects. MOQ: 5kg', 45.00, 'Yarns', true),

-- THREADS
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Polyester Spool x 10', 'All-purpose sewing thread. MOQ: 100 packs', 12.00, 'Threads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Metallic Embroidery Thread', 'Gold/Silver reflective thread. MOQ: 50 spools', 8.00, 'Threads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Heavy Duty Nylon Thread', 'For leather and thick upholstery. MOQ: 20 spools', 15.00, 'Threads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Elastic Thread Roll', 'For shirring and elasticated sewing. MOQ: 50 rolls', 6.00, 'Threads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Gutterman Multi-pack Kit', 'Premium German thread variety. MOQ: 5 kits', 50.00, 'Threads', true),

-- BUTTONS
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Vintage Wooden Buttons', 'Assorted sizes, natural finish. MOQ: 500 pcs', 0.50, 'Buttons', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Fancy Metallic Gold Buttons', 'Lion head embossed design. MOQ: 200 pcs', 1.20, 'Buttons', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Pearl Finish Plastic Buttons', 'For shirts and light dresses. MOQ: 1000 pcs', 0.20, 'Buttons', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Snap Buttons x 100', 'Stainless steel rivets. MOQ: 50 packs', 15.00, 'Buttons', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Toggles for Coats', 'Durable resin horn toggles. MOQ: 100 pcs', 2.50, 'Buttons', true),

-- FABRICS
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Raw Denim 14oz', 'Heavy duty indigo denim. MOQ: 20 meters', 12.00, 'Fabrics', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Bridal Satin High-Gloss', 'For evening gowns and decor. MOQ: 50 meters', 8.50, 'Fabrics', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Floral Cotton Print', 'Spring collection breathables. MOQ: 100 meters', 5.00, 'Fabrics', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Heavy Upholstery Velvet', 'Royal blue velvet for sofas. MOQ: 10 meters', 18.00, 'Fabrics', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Linen Blend Canvas', 'Natural texture for crafts. MOQ: 30 meters', 7.00, 'Fabrics', true),

-- BEADS
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Glass Seed Beads 12/0', 'Standard uniform seed beads. MOQ: 50 tubes', 4.00, 'Beads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Crystal Faceted Rondelles', 'Sparkling jewelry beads. MOQ: 200 pcs', 0.80, 'Beads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'African Wooden Beads', 'Hand carved, mixed patterns. MOQ: 20 strands', 5.50, 'Beads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Acrylic Neon Mix Beads', 'Bright beads for accessories. MOQ: 100 bags', 3.00, 'Beads', true),
('d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882', 'Semi-Precious Jade Beads', 'Authentic jade stones. MOQ: 10 strands', 12.00, 'Beads', true);
