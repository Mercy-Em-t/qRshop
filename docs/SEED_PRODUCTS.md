-- Seed mock products into the Demo Shop (ID: 11111111-1111-1111-1111-111111111111)

insert into public.menu_items (shop_id, name, description, price, category)
values 
  ('11111111-1111-1111-1111-111111111111', 'Signature Smash Burger', 'Double wagyu beef patty, melted cheddar, house sauce, brioche bun.', 12.50, 'Mains'),
  ('11111111-1111-1111-1111-111111111111', 'Spicy Crispy Chicken', 'Buttermilk fried chicken breast, spicy slaw, pickles.', 11.00, 'Mains'),
  ('11111111-1111-1111-1111-111111111111', 'Truffle Parmesan Fries', 'Crispy shoestring fries tossed in white truffle oil and aged parmesan.', 5.50, 'Sides'),
  ('11111111-1111-1111-1111-111111111111', 'Sweet Potato Wedges', 'Thick cut sweet potato wedges with smoked paprika aioli.', 4.50, 'Sides'),
  ('11111111-1111-1111-1111-111111111111', 'Artisan Cola', 'Small batch craft cola with real cane sugar.', 3.00, 'Beverages'),
  ('11111111-1111-1111-1111-111111111111', 'Fresh Squeezed Lemonade', 'Made hourly with organic lemons and agave.', 3.50, 'Beverages')
on conflict do nothing;
