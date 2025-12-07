-- Add instagram_url to giveaways
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS instagram_url text;

-- Add is_cancelled and cancelled_at to bookings for cancellation feature
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_by text; -- 'client' or 'admin'