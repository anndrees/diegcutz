-- Add password reset fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_password_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_password_created_at TIMESTAMP WITH TIME ZONE;

-- Create password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT,
  contact_value TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved, dismissed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for password_reset_requests (admin only via permissive for the local auth system)
CREATE POLICY "Anyone can view password reset requests" ON public.password_reset_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert password reset requests" ON public.password_reset_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update password reset requests" ON public.password_reset_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete password reset requests" ON public.password_reset_requests FOR DELETE USING (true);