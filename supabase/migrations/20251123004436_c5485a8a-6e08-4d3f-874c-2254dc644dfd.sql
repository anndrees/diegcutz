-- Add coming_soon column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

-- Update RLS policies to ensure they work correctly
-- (No changes needed, existing policies are sufficient)