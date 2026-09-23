ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_ids jsonb DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.bookings.service_ids IS 'Stable catalog IDs used to repeat a booking; legacy services text remains supported.';
