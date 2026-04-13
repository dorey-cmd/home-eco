-- 1. Create the Workspace Members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('MEMBER', 'VIEWER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop old workspace access policies and allow viewing workspaces if owner OR member
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their workspaces" ON public.workspaces;

CREATE POLICY "Users can view workspaces" ON public.workspaces FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Users can insert workspaces" ON public.workspaces FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);
CREATE POLICY "Users can update workspaces" ON public.workspaces FOR UPDATE USING (
  owner_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Users can delete workspaces" ON public.workspaces FOR DELETE USING (
  owner_id = auth.uid() OR public.is_admin()
);

-- Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members FOR SELECT USING (
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR user_id = auth.uid() OR public.is_admin()
);

-- 3. HELPER FUNCTION: allow easier boolean check for read/write access without Policy Recursion
CREATE OR REPLACE FUNCTION public.can_read_workspace(ws_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid()
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_write_workspace(ws_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid() AND role IN ('ADMIN', 'MEMBER')
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update ALL entities with the new helper functions

-- PRODUCTS
DROP POLICY IF EXISTS "Users can view products in their workspaces" ON public.products;
DROP POLICY IF EXISTS "Users can insert products in their workspaces" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their workspaces" ON public.products;
DROP POLICY IF EXISTS "Users can delete products in their workspaces" ON public.products;

CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (public.can_read_workspace(workspace_id));
CREATE POLICY "Users can insert products" ON public.products FOR INSERT WITH CHECK (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can update products" ON public.products FOR UPDATE USING (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can delete products" ON public.products FOR DELETE USING (public.can_write_workspace(workspace_id));

-- CATEGORIES
DROP POLICY IF EXISTS "Users can view categories in their workspaces" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories in their workspaces" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories in their workspaces" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories in their workspaces" ON public.categories;

CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (public.can_read_workspace(workspace_id));
CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT WITH CHECK (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE USING (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can delete categories" ON public.categories FOR DELETE USING (public.can_write_workspace(workspace_id));

-- LOCATIONS
DROP POLICY IF EXISTS "Users can view locations in their workspaces" ON public.locations;
DROP POLICY IF EXISTS "Users can insert locations in their workspaces" ON public.locations;
DROP POLICY IF EXISTS "Users can update locations in their workspaces" ON public.locations;
DROP POLICY IF EXISTS "Users can delete locations in their workspaces" ON public.locations;

CREATE POLICY "Users can view locations" ON public.locations FOR SELECT USING (public.can_read_workspace(workspace_id));
CREATE POLICY "Users can insert locations" ON public.locations FOR INSERT WITH CHECK (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can update locations" ON public.locations FOR UPDATE USING (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can delete locations" ON public.locations FOR DELETE USING (public.can_write_workspace(workspace_id));

-- STORES
DROP POLICY IF EXISTS "Users can view stores in their workspaces" ON public.stores;
DROP POLICY IF EXISTS "Users can insert stores in their workspaces" ON public.stores;
DROP POLICY IF EXISTS "Users can update stores in their workspaces" ON public.stores;
DROP POLICY IF EXISTS "Users can delete stores in their workspaces" ON public.stores;

CREATE POLICY "Users can view stores" ON public.stores FOR SELECT USING (public.can_read_workspace(workspace_id));
CREATE POLICY "Users can insert stores" ON public.stores FOR INSERT WITH CHECK (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can update stores" ON public.stores FOR UPDATE USING (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can delete stores" ON public.stores FOR DELETE USING (public.can_write_workspace(workspace_id));

-- PURCHASES
DROP POLICY IF EXISTS "Users can view purchases for their products" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert purchases for their products" ON public.purchases;
DROP POLICY IF EXISTS "Users can update purchases for their products" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete purchases for their products" ON public.purchases;

CREATE POLICY "Users can view purchases" ON public.purchases FOR SELECT USING (public.can_read_workspace(workspace_id));
CREATE POLICY "Users can insert purchases" ON public.purchases FOR INSERT WITH CHECK (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can update purchases" ON public.purchases FOR UPDATE USING (public.can_write_workspace(workspace_id));
CREATE POLICY "Users can delete purchases" ON public.purchases FOR DELETE USING (public.can_write_workspace(workspace_id));
