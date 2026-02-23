
-- Add loyalty_token to profiles for QR code identification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Add loyalty tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS loyalty_credited boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS loyalty_credited_by text;

-- Drop old auto-credit trigger (we'll use cron-based system instead)
DROP TRIGGER IF EXISTS update_loyalty_on_booking ON public.bookings;

-- Backfill: mark all qualifying past bookings as already credited
UPDATE bookings SET loyalty_credited = true, loyalty_credited_by = 'auto' 
WHERE user_id IS NOT NULL 
AND total_price >= 5 
AND (is_cancelled IS NULL OR is_cancelled = false) 
AND loyalty_credited = false;
