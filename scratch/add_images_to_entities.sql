-- Add image column to Categories, Locations, and Stores
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image TEXT;
