-- 1. Ensure all image columns exist securely
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Ensure need_to_buy doesn't exist (safety cleanup if someone added it)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS need_to_buy;

-- 3. Replace the Registration Trigger Safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
  
  -- Use standard := syntax for variables
  cat_veg UUID := gen_random_uuid();
  cat_clean UUID := gen_random_uuid();
  cat_dairy UUID := gen_random_uuid();
  cat_wine UUID := gen_random_uuid();
  cat_drinks UUID := gen_random_uuid();

  loc_fridge UUID := gen_random_uuid();
  loc_pantry UUID := gen_random_uuid();
  loc_clean UUID := gen_random_uuid();
  loc_laundry UUID := gen_random_uuid();
  loc_bath UUID := gen_random_uuid();

  store_super UUID := gen_random_uuid();
  store_veg UUID := gen_random_uuid();
  store_meat UUID := gen_random_uuid();
  store_pharm UUID := gen_random_uuid();
  store_spice UUID := gen_random_uuid();
BEGIN
  -- A. Create a profile entry
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'PRIVATE'));

  -- B. Create the default initial workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (new.id, 'סביבת תפעול ראשית')
  RETURNING id INTO new_workspace_id;

  -- C. Insert Starter Kit Categories
  INSERT INTO public.categories (id, workspace_id, name, "order", image) VALUES
    (cat_veg, new_workspace_id, 'ירקות ופירות', 1, 'https://placehold.co/200x200/e8f5e9/2e7d32?text=🥦'),
    (cat_clean, new_workspace_id, 'חומרי ניקוי', 2, 'https://placehold.co/200x200/e3f2fd/1565c0?text=🧽'),
    (cat_dairy, new_workspace_id, 'מוצרי חלב', 3, 'https://placehold.co/200x200/fff3e0/e65100?text=🧀'),
    (cat_wine, new_workspace_id, 'יינות', 4, 'https://placehold.co/200x200/fce4ec/c2185b?text=🍷'),
    (cat_drinks, new_workspace_id, 'שתיה קלה', 5, 'https://placehold.co/200x200/fffde7/f57f17?text=🥤');

  -- D. Insert Starter Kit Locations
  INSERT INTO public.locations (id, workspace_id, name, "order", image) VALUES
    (loc_fridge, new_workspace_id, 'מקרר', 1, 'https://placehold.co/200x200/eceff1/455a64?text=❄️'),
    (loc_pantry, new_workspace_id, 'מזווה', 2, 'https://placehold.co/200x200/eceff1/455a64?text=🚪'),
    (loc_clean, new_workspace_id, 'ארון חומרי ניקוי', 3, 'https://placehold.co/200x200/eceff1/455a64?text=🧼'),
    (loc_laundry, new_workspace_id, 'חדר כביסה', 4, 'https://placehold.co/200x200/eceff1/455a64?text=🧺'),
    (loc_bath, new_workspace_id, 'ארון אמבטיה', 5, 'https://placehold.co/200x200/eceff1/455a64?text=🛁');

  -- E. Insert Starter Kit Stores
  INSERT INTO public.stores (id, workspace_id, name, "order", image) VALUES
    (store_super, new_workspace_id, 'סופרמארקט', 1, 'https://placehold.co/200x200/f5f5f5/424242?text=🛒'),
    (store_veg, new_workspace_id, 'ירקניה שכונתית', 2, 'https://placehold.co/200x200/f5f5f5/424242?text=🏪'),
    (store_meat, new_workspace_id, 'קצב', 3, 'https://placehold.co/200x200/f5f5f5/424242?text=🥩'),
    (store_pharm, new_workspace_id, 'סופרפארם', 4, 'https://placehold.co/200x200/f5f5f5/424242?text=💊'),
    (store_spice, new_workspace_id, 'חנות תבלינים', 5, 'https://placehold.co/200x200/f5f5f5/424242?text=🌶️');

  -- F. Insert Starter Kit Products
  INSERT INTO public.products (workspace_id, name, target_quantity, current_quantity, category_id, location_id, store_id, sku, image) VALUES
    (new_workspace_id, 'עגבניות', 2, 1, cat_veg, loc_fridge, store_veg, '', 'https://placehold.co/200x200/ffdddd/dd0000?text=🍅'),
    (new_workspace_id, 'מלפפונים', 2, 2, cat_veg, loc_fridge, store_veg, '', 'https://placehold.co/200x200/ddffdd/008800?text=🥒'),
    (new_workspace_id, 'בצל יבש', 1, 1, cat_veg, loc_pantry, store_veg, '', 'https://placehold.co/200x200/ffeedd/dd8800?text=🧅'),
    (new_workspace_id, 'תפוחי אדמה', 1, 1, cat_veg, loc_pantry, store_veg, '', 'https://placehold.co/200x200/eeddaa/aa8800?text=🥔'),
    
    (new_workspace_id, 'אקונומיקה', 2, 1, cat_clean, loc_clean, store_super, '', 'https://placehold.co/200x200/ddddff/0000ff?text=🧪'),
    (new_workspace_id, 'נוזל רצפות', 1, 1, cat_clean, loc_clean, store_super, '', 'https://placehold.co/200x200/ddffff/00aaaa?text=✨'),
    (new_workspace_id, 'נוזל כביסה', 1, 0, cat_clean, loc_laundry, store_pharm, '', 'https://placehold.co/200x200/ffddff/aa00aa?text=🧴'),
    (new_workspace_id, 'מרכך כביסה', 1, 1, cat_clean, loc_laundry, store_pharm, '', 'https://placehold.co/200x200/ffddff/aa00aa?text=🌸'),
    
    (new_workspace_id, 'חלב 3%', 3, 2, cat_dairy, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffffff/000000?text=🥛'),
    (new_workspace_id, 'גבינה צהובה תנובה', 1, 1, cat_dairy, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffffdd/aaaa00?text=🧀'),
    (new_workspace_id, 'קוטג''', 2, 1, cat_dairy, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffffff/000000?text=🥣'),
    (new_workspace_id, 'יוגורט טבעי', 4, 4, cat_dairy, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffffff/000000?text=🥄'),

    (new_workspace_id, 'יין אדום קברנה', 2, 1, cat_wine, loc_pantry, store_super, '', 'https://placehold.co/200x200/ffdddd/dd0000?text=🍷'),
    (new_workspace_id, 'יין לבן חצי יבש', 1, 0, cat_wine, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffffdd/aaaa00?text=🥂'),
    
    (new_workspace_id, 'קוקה קולה זירו (שישיה)', 2, 1, cat_drinks, loc_pantry, store_super, '', 'https://placehold.co/200x200/000000/ffffff?text=🥤'),
    (new_workspace_id, 'מים מינרלים (שישיה)', 3, 1, cat_drinks, loc_pantry, store_super, '', 'https://placehold.co/200x200/ddffff/00aaaa?text=💧'),
    (new_workspace_id, 'מיץ תפוזים פריגת', 1, 1, cat_drinks, loc_fridge, store_super, '', 'https://placehold.co/200x200/ffddaa/dd8800?text=🍊'),

    (new_workspace_id, 'חזה עוף חתוך', 2, 1, cat_veg, loc_fridge, store_meat, '', 'https://placehold.co/200x200/ffdddd/dd0000?text=🍗'),
    (new_workspace_id, 'פפריקה מתוקה', 1, 1, cat_veg, loc_pantry, store_spice, '', 'https://placehold.co/200x200/ffaaaa/dd0000?text=🌶️'),
    (new_workspace_id, 'מלח דק', 2, 1, cat_veg, loc_pantry, store_super, '', 'https://placehold.co/200x200/ffffff/000000?text=🧂');

  RETURN NEW;
END;
$$;
