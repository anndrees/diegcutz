-- Add restriction and ban columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_restricted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS restriction_ends_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS restricted_at timestamp with time zone;

-- Create policy to allow admins to update these fields
CREATE POLICY "Admins can update restriction and ban fields"
ON public.profiles
FOR UPDATE
USING (true)
WITH CHECK (true);