-- Helper functions for specialized roles

CREATE OR REPLACE FUNCTION public.can_operate_workspace(ws_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  -- Returns TRUE for OWNER, ADMIN, MEMBER, and VIEWER (Shopping Partner)
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid() AND role IN ('ADMIN', 'MEMBER', 'VIEWER')
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_workspace(ws_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  -- Returns TRUE only for full managers (OWNER, ADMIN, MEMBER)
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid() AND role IN ('ADMIN', 'MEMBER')
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix policies for Products
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;

CREATE POLICY "Users can insert products" ON public.products FOR INSERT WITH CHECK (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can update products" ON public.products FOR UPDATE USING (public.can_operate_workspace(workspace_id));
CREATE POLICY "Users can delete products" ON public.products FOR DELETE USING (public.can_manage_workspace(workspace_id));

-- Fix policies for Purchases (Shopping partners can insert/update them)
DROP POLICY IF EXISTS "Users can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete purchases" ON public.purchases;

CREATE POLICY "Users can insert purchases" ON public.purchases FOR INSERT WITH CHECK (public.can_operate_workspace(workspace_id));
CREATE POLICY "Users can update purchases" ON public.purchases FOR UPDATE USING (public.can_operate_workspace(workspace_id));
CREATE POLICY "Users can delete purchases" ON public.purchases FOR DELETE USING (public.can_manage_workspace(workspace_id));

-- Other entities (Categories, Stores, Locations) should remain restricted to Managers
DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories" ON public.categories;

CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT WITH CHECK (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE USING (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can delete categories" ON public.categories FOR DELETE USING (public.can_manage_workspace(workspace_id));

DROP POLICY IF EXISTS "Users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete locations" ON public.locations;

CREATE POLICY "Users can insert locations" ON public.locations FOR INSERT WITH CHECK (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can update locations" ON public.locations FOR UPDATE USING (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can delete locations" ON public.locations FOR DELETE USING (public.can_manage_workspace(workspace_id));

DROP POLICY IF EXISTS "Users can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update stores" ON public.stores;
DROP POLICY IF EXISTS "Users can delete stores" ON public.stores;

CREATE POLICY "Users can insert stores" ON public.stores FOR INSERT WITH CHECK (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can update stores" ON public.stores FOR UPDATE USING (public.can_manage_workspace(workspace_id));
CREATE POLICY "Users can delete stores" ON public.stores FOR DELETE USING (public.can_manage_workspace(workspace_id));
