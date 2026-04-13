-- Fix RLS policy on profiles to ensure ADMINs can fetch all users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;

-- Allow reading a profile if it's your own, or if you are an admin
CREATE POLICY "Users can view their own profile or admins can view all" ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.is_admin()
);
