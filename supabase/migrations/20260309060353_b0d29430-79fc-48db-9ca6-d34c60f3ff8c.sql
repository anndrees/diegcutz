
-- Add birthday to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date DEFAULT NULL;

-- Add admin_notes, pause fields, and payment_status to user_memberships
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT NULL;
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS pause_end_date date DEFAULT NULL;
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';

-- Create membership_history table for tracking all changes
CREATE TABLE IF NOT EXISTS public.membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id),
  action text NOT NULL,
  details text,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on membership_history
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for membership_history
CREATE POLICY "Anyone can view membership history" ON public.membership_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert membership history" ON public.membership_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete membership history" ON public.membership_history FOR DELETE USING (true);

-- Create membership_surveys table for satisfaction surveys
CREATE TABLE IF NOT EXISTS public.membership_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view surveys" ON public.membership_surveys FOR SELECT USING (true);
CREATE POLICY "Users can insert own surveys" ON public.membership_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
