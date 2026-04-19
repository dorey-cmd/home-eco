-- Run this script in your Supabase SQL Editor to fix DB issues

-- 1. Create the missing workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 2. Enable RLS on the new table
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 3. Add Policies securely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workspace_members' AND policyname = 'Users can view members of their workspaces'
    ) THEN
        CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members FOR SELECT USING (
          workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR 
          workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workspace_members' AND policyname = 'Owners can insert members'
    ) THEN
        CREATE POLICY "Owners can insert members" ON public.workspace_members FOR INSERT WITH CHECK (
          workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
        );
    END IF;
END $$;

-- 4. Reload the Schema Cache so the API Edge Functions can cleanly recognize it
NOTIFY pgrst, 'reload schema';

-- 5. Fix broken image URLs for existing accounts
UPDATE public.products SET image = 'https://upload.wikimedia.org/wikipedia/commons/9/96/Cucumber_and_slices.jpg' WHERE name = 'מלפפונים' AND image LIKE '%unsplash%';
UPDATE public.products SET image = 'https://upload.wikimedia.org/wikipedia/commons/2/25/Onion_on_White.JPG' WHERE name = 'בצל יבש' AND image LIKE '%unsplash%';
UPDATE public.products SET image = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg' WHERE name = 'עגבניות' AND image LIKE '%unsplash%';
UPDATE public.products SET image = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Patates.jpg' WHERE name = 'תפוחי אדמה' AND image LIKE '%unsplash%';

-- Also add 'כללי', 'מיקום כללי' and 'קניות כללי' to existing workspaces that lack them:
DO $$
DECLARE
    ws RECORD;
BEGIN
    FOR ws IN SELECT id FROM public.workspaces LOOP
        -- Categories
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE workspace_id = ws.id AND (name = 'כללי' OR name = 'כללית')) THEN
            INSERT INTO public.categories (workspace_id, name, "order", image) VALUES (ws.id, 'כללי', 0, 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200');
        END IF;

        -- Locations
        IF NOT EXISTS (SELECT 1 FROM public.locations WHERE workspace_id = ws.id AND name = 'מיקום כללי') THEN
            INSERT INTO public.locations (workspace_id, name, "order", image) VALUES (ws.id, 'מיקום כללי', 0, 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=200');
        END IF;

        -- Stores
        IF NOT EXISTS (SELECT 1 FROM public.stores WHERE workspace_id = ws.id AND (name = 'קניות כללי' OR name = 'חנות כללית')) THEN
            INSERT INTO public.stores (workspace_id, name, "order", image) VALUES (ws.id, 'קניות כללי', 0, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200');
        END IF;
    END LOOP;
END $$;
