-- Onboarding Deep Clone Algorithm
-- Executes automatically when a new user signs up.
-- Clones entire workspace from default-home@gor-ziv.com

-- 1. DROP the existing trigger so we can safely redefine the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. CREATE or REPLACE the function logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    new_workspace_id UUID;
    template_uid UUID;
    template_ws_id UUID;
BEGIN
    ---------- 1. CREATE CORE IDENTITIES ----------
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'PRIVATE');

    INSERT INTO public.workspaces (owner_id, name)
    VALUES (new.id, 'המרחב הראשי')
    RETURNING id INTO new_workspace_id;

    ---------- 2. LOCATE TEMPLATE DOMAIN ----------
    SELECT id INTO template_uid FROM auth.users WHERE email = 'default-home@gor-ziv.com' LIMIT 1;
    
    -- If template user doesn't exist, exit cleanly (empty workspace)
    IF template_uid IS NULL THEN 
       RETURN new;
    END IF;

    -- Grab template user's primary workspace
    SELECT id INTO template_ws_id FROM public.workspaces WHERE owner_id = template_uid ORDER BY created_at ASC LIMIT 1;
    IF template_ws_id IS NULL THEN 
       RETURN new;
    END IF;

    ---------- 3. CLONE CATEGORIES & MAP IDs ----------
    CREATE TEMP TABLE tmp_cat_map (old_id UUID, new_id UUID, cat_name TEXT) ON COMMIT DROP;
    
    WITH inserted AS (
        INSERT INTO public.categories (workspace_id, name, "order", image)
        SELECT new_workspace_id, name, "order", image 
        FROM public.categories WHERE workspace_id = template_ws_id
        RETURNING id as new_cat_id, name as i_cat_name
    )
    INSERT INTO tmp_cat_map (new_id, old_id, cat_name)
    SELECT i.new_cat_id, c.id, i.i_cat_name 
    FROM inserted i 
    JOIN public.categories c ON c.workspace_id = template_ws_id AND c.name = i.i_cat_name;

    ---------- 4. CLONE LOCATIONS & MAP IDs ----------
    CREATE TEMP TABLE tmp_loc_map (old_id UUID, new_id UUID, loc_name TEXT) ON COMMIT DROP;
    
    WITH inserted AS (
        INSERT INTO public.locations (workspace_id, name, "order", image)
        SELECT new_workspace_id, name, "order", image 
        FROM public.locations WHERE workspace_id = template_ws_id
        RETURNING id as new_loc_id, name as i_loc_name
    )
    INSERT INTO tmp_loc_map (new_id, old_id, loc_name)
    SELECT i.new_loc_id, l.id, i.i_loc_name 
    FROM inserted i 
    JOIN public.locations l ON l.workspace_id = template_ws_id AND l.name = i.i_loc_name;

    ---------- 5. CLONE STORES & MAP IDs ----------
    CREATE TEMP TABLE tmp_store_map (old_id UUID, new_id UUID, store_name TEXT) ON COMMIT DROP;
    
    WITH inserted AS (
        INSERT INTO public.stores (workspace_id, name, "order", image)
        SELECT new_workspace_id, name, "order", image 
        FROM public.stores WHERE workspace_id = template_ws_id
        RETURNING id as new_store_id, name as i_store_name
    )
    INSERT INTO tmp_store_map (new_id, old_id, store_name)
    SELECT i.new_store_id, s.id, i.i_store_name 
    FROM inserted i 
    JOIN public.stores s ON s.workspace_id = template_ws_id AND s.name = i.i_store_name;

    ---------- 6. CLONE PRODUCTS ----------
    INSERT INTO public.products (workspace_id, name, target_quantity, current_quantity, category_id, location_id, store_id, sku, image, purchase_url, price)
    SELECT 
        new_workspace_id, 
        p.name, 
        p.target_quantity, 
        p.current_quantity, 
        cm.new_id, 
        lm.new_id, 
        sm.new_id, 
        p.sku, 
        p.image, 
        p.purchase_url, 
        p.price
    FROM public.products p
    LEFT JOIN tmp_cat_map cm ON cm.old_id = p.category_id
    LEFT JOIN tmp_loc_map lm ON lm.old_id = p.location_id
    LEFT JOIN tmp_store_map sm ON sm.old_id = p.store_id
    WHERE p.workspace_id = template_ws_id;

    RETURN new;
END;
$$;

-- 3. RE-BIND THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
