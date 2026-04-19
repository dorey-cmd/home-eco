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
  cat_general UUID := gen_random_uuid();

  loc_fridge UUID := gen_random_uuid();
  loc_pantry UUID := gen_random_uuid();
  loc_clean UUID := gen_random_uuid();
  loc_laundry UUID := gen_random_uuid();
  loc_bath UUID := gen_random_uuid();
  loc_general UUID := gen_random_uuid();

  store_super UUID := gen_random_uuid();
  store_veg UUID := gen_random_uuid();
  store_meat UUID := gen_random_uuid();
  store_pharm UUID := gen_random_uuid();
  store_spice UUID := gen_random_uuid();
  store_general UUID := gen_random_uuid();
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
    (cat_general, new_workspace_id, 'כללי', 0, 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200'),
    (cat_veg, new_workspace_id, 'ירקות ופירות', 1, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200'),
    (cat_clean, new_workspace_id, 'חומרי ניקוי', 2, 'https://images.unsplash.com/photo-1584820927598-cffecc6555cc?w=200'),
    (cat_dairy, new_workspace_id, 'מוצרי חלב', 3, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200'),
    (cat_wine, new_workspace_id, 'יינות', 4, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200'),
    (cat_drinks, new_workspace_id, 'שתיה קלה', 5, 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?w=200');

  -- D. Insert Starter Kit Locations
  INSERT INTO public.locations (id, workspace_id, name, "order", image) VALUES
    (loc_general, new_workspace_id, 'מיקום כללי', 0, 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=200'),
    (loc_fridge, new_workspace_id, 'מקרר', 1, 'https://images.unsplash.com/photo-1584285418504-01018e6ce6c9?w=200'),
    (loc_pantry, new_workspace_id, 'מזווה', 2, 'https://images.unsplash.com/photo-1590005022879-880290947ba9?w=200'),
    (loc_clean, new_workspace_id, 'ארון חומרי ניקוי', 3, 'https://images.unsplash.com/photo-1603522207198-8e6d9b5e527d?w=200'),
    (loc_laundry, new_workspace_id, 'חדר כביסה', 4, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200'),
    (loc_bath, new_workspace_id, 'ארון אמבטיה', 5, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200');

  -- E. Insert Starter Kit Stores
  INSERT INTO public.stores (id, workspace_id, name, "order", image) VALUES
    (store_general, new_workspace_id, 'קניות כללי', 0, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200'),
    (store_super, new_workspace_id, 'סופרמארקט', 1, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200'),
    (store_veg, new_workspace_id, 'ירקניה שכונתית', 2, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200'),
    (store_meat, new_workspace_id, 'קצב', 3, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=200'),
    (store_pharm, new_workspace_id, 'סופרפארם', 4, 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200'),
    (store_spice, new_workspace_id, 'חנות תבלינים', 5, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200');

  -- F. Insert Starter Kit Products
  INSERT INTO public.products (workspace_id, name, target_quantity, current_quantity, category_id, location_id, store_id, sku, image) VALUES
    (new_workspace_id, 'עגבניות', 2, 1, cat_veg, loc_fridge, store_veg, '', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200'),
    (new_workspace_id, 'מלפפונים', 2, 2, cat_veg, loc_fridge, store_veg, '', 'https://images.unsplash.com/photo-1604977042946-1eecc30f6532?w=200'),
    (new_workspace_id, 'בצל יבש', 1, 1, cat_veg, loc_pantry, store_veg, '', 'https://images.unsplash.com/photo-1618512496248-a0e28e4695eb?w=200'),
    (new_workspace_id, 'תפוחי אדמה', 1, 1, cat_veg, loc_pantry, store_veg, '', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200'),
    
    (new_workspace_id, 'אקונומיקה', 2, 1, cat_clean, loc_clean, store_super, '', 'https://images.unsplash.com/photo-1585421514738-0245a499a0ed?w=200'),
    (new_workspace_id, 'נוזל רצפות', 1, 1, cat_clean, loc_clean, store_super, '', 'https://images.unsplash.com/photo-1584820927598-cffecc6555cc?w=200'),
    (new_workspace_id, 'נוזל כביסה', 1, 0, cat_clean, loc_laundry, store_pharm, '', 'https://images.unsplash.com/photo-1610557892470-55d9e18b0ee2?w=200'),
    (new_workspace_id, 'מרכך כביסה', 1, 1, cat_clean, loc_laundry, store_pharm, '', 'https://images.unsplash.com/photo-1520336214828-5b3ea7090887?w=200'),
    
    (new_workspace_id, 'חלב 3%', 3, 2, cat_dairy, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200'),
    (new_workspace_id, 'גבינה צהובה תנובה', 1, 1, cat_dairy, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200'),
    (new_workspace_id, 'קוטג''', 2, 1, cat_dairy, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1531260840455-8ecfe440a358?w=200'),
    (new_workspace_id, 'יוגורט טבעי', 4, 4, cat_dairy, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1571212879599-231a5bd8b913?w=200'),

    (new_workspace_id, 'יין אדום קברנה', 2, 1, cat_wine, loc_pantry, store_super, '', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=200'),
    (new_workspace_id, 'יין לבן חצי יבש', 1, 0, cat_wine, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=200'),
    
    (new_workspace_id, 'קוקה קולה זירו (שישיה)', 2, 1, cat_drinks, loc_pantry, store_super, '', 'https://images.unsplash.com/photo-1622483767028-fd16792bf3ee?w=200'),
    (new_workspace_id, 'מים מינרלים (שישיה)', 3, 1, cat_drinks, loc_pantry, store_super, '', 'https://images.unsplash.com/photo-1523362249712-421b1b11ca3c?w=200'),
    (new_workspace_id, 'מיץ תפוזים פריגת', 1, 1, cat_drinks, loc_fridge, store_super, '', 'https://images.unsplash.com/photo-1600271886742-f049dd45fba8?w=200'),

    (new_workspace_id, 'חזה עוף חתוך', 2, 1, cat_veg, loc_fridge, store_meat, '', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200'),
    (new_workspace_id, 'פפריקה מתוקה', 1, 1, cat_veg, loc_pantry, store_spice, '', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200'),
    (new_workspace_id, 'מלח דק', 2, 1, cat_veg, loc_pantry, store_super, '', 'https://images.unsplash.com/photo-1514986882353-84725049fb92?w=200');

  RETURN NEW;
END;
$$;
