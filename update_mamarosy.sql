UPDATE public.menu_items SET attributes = '{"weight": "1kg", "grade": "Grade 1", "origin": "Mwea"}'::jsonb WHERE shop_id = 'deada001-1111-4444-8888-deada0016666' AND name = 'Brown rice';
UPDATE public.menu_items SET attributes = '{"volume": "500g", "origin": "Baringo", "type": "Wildflower"}'::jsonb WHERE shop_id = 'deada001-1111-4444-8888-deada0016666' AND name = 'Honey (raw)';
UPDATE public.menu_items SET attributes = '{"weight": "250g", "benefits": "High Omega-3"}'::jsonb WHERE shop_id = 'deada001-1111-4444-8888-deada0016666' AND name = 'Chia seeds';
