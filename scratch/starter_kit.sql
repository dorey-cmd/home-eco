-- Update user creation trigger to include a starter kit

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
  
  -- Categories
  cat_veg UUID = gen_random_uuid();
  cat_clean UUID = gen_random_uuid();
  cat_dairy UUID = gen_random_uuid();
  cat_wine UUID = gen_random_uuid();
  cat_drinks UUID = gen_random_uuid();

  -- Locations
  loc_fridge UUID = gen_random_uuid();
  loc_pantry UUID = gen_random_uuid();
  loc_clean UUID = gen_random_uuid();
  loc_laundry UUID = gen_random_uuid();
  loc_bath UUID = gen_random_uuid();

  -- Stores
  store_super UUID = gen_random_uuid();
  store_veg UUID = gen_random_uuid();
  store_meat UUID = gen_random_uuid();
  store_pharm UUID = gen_random_uuid();
  store_spice UUID = gen_random_uuid();
BEGIN
  -- 1. Create a profile entry
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'PRIVATE'));

  -- 2. Create the default initial workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (new.id, 'סביבת תפעול ראשית')
  RETURNING id INTO new_workspace_id;

  -- 3. Insert Starter Kit Categories
  INSERT INTO public.categories (id, workspace_id, name, "order") VALUES
    (cat_veg, new_workspace_id, 'ירקות ופירות', 1),
    (cat_clean, new_workspace_id, 'חומרי ניקוי', 2),
    (cat_dairy, new_workspace_id, 'מוצרי חלב', 3),
    (cat_wine, new_workspace_id, 'יינות', 4),
    (cat_drinks, new_workspace_id, 'שתיה קלה', 5);

  -- 4. Insert Starter Kit Locations
  INSERT INTO public.locations (id, workspace_id, name, "order") VALUES
    (loc_fridge, new_workspace_id, 'מקרר', 1),
    (loc_pantry, new_workspace_id, 'מזווה', 2),
    (loc_clean, new_workspace_id, 'ארון חומרי ניקוי', 3),
    (loc_laundry, new_workspace_id, 'חדר כביסה', 4),
    (loc_bath, new_workspace_id, 'ארון אמבטיה', 5);

  -- 5. Insert Starter Kit Stores
  INSERT INTO public.stores (id, workspace_id, name, "order") VALUES
    (store_super, new_workspace_id, 'סופרמארקט', 1),
    (store_veg, new_workspace_id, 'ירקניה שכונתית', 2),
    (store_meat, new_workspace_id, 'קצב', 3),
    (store_pharm, new_workspace_id, 'סופרפארם', 4),
    (store_spice, new_workspace_id, 'חנות תבלינים', 5);

  -- 6. Insert Starter Kit Products (20 common items)
  INSERT INTO public.products (workspace_id, name, target_quantity, current_quantity, category_id, location_id, store_id, sku) VALUES
    (new_workspace_id, 'עגבניות', 2, 1, cat_veg, loc_fridge, store_veg, ''),
    (new_workspace_id, 'מלפפונים', 2, 2, cat_veg, loc_fridge, store_veg, ''),
    (new_workspace_id, 'בצל יבש', 1, 1, cat_veg, loc_pantry, store_veg, ''),
    (new_workspace_id, 'תפוחי אדמה', 1, 1, cat_veg, loc_pantry, store_veg, ''),
    
    (new_workspace_id, 'אקונומיקה', 2, 1, cat_clean, loc_clean, store_super, ''),
    (new_workspace_id, 'נוזל רצפות', 1, 1, cat_clean, loc_clean, store_super, ''),
    (new_workspace_id, 'נוזל כביסה', 1, 0, cat_clean, loc_laundry, store_pharm, ''),
    (new_workspace_id, 'מרכך כביסה', 1, 1, cat_clean, loc_laundry, store_pharm, ''),
    
    (new_workspace_id, 'חלב 3%', 3, 2, cat_dairy, loc_fridge, store_super, ''),
    (new_workspace_id, 'גבינה צהובה תנובה', 1, 1, cat_dairy, loc_fridge, store_super, ''),
    (new_workspace_id, 'קוטג''', 2, 1, cat_dairy, loc_fridge, store_super, ''),
    (new_workspace_id, 'יוגורט טבעי', 4, 4, cat_dairy, loc_fridge, store_super, ''),

    (new_workspace_id, 'יין אדום קברנה', 2, 1, cat_wine, loc_pantry, store_super, ''),
    (new_workspace_id, 'יין לבן חצי יבש', 1, 0, cat_wine, loc_fridge, store_super, ''),
    
    (new_workspace_id, 'קוקה קולה זירו (שישיה)', 2, 1, cat_drinks, loc_pantry, store_super, ''),
    (new_workspace_id, 'מים מינרלים (שישיה)', 3, 1, cat_drinks, loc_pantry, store_super, ''),
    (new_workspace_id, 'מיץ תפוזים פריגת', 1, 1, cat_drinks, loc_fridge, store_super, ''),

    (new_workspace_id, 'חזה עוף חתוך', 2, 1, cat_veg, loc_fridge, store_meat, ''), -- mapping to meat store, temp cat
    (new_workspace_id, 'פפריקה מתוקה', 1, 1, cat_veg, loc_pantry, store_spice, ''),
    (new_workspace_id, 'מלח דק', 2, 1, cat_veg, loc_pantry, store_super, '');

  RETURN NEW;
END;
$$;
