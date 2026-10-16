CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_active_slot
ON public.bookings (booking_date, booking_time)
WHERE is_cancelled IS NOT TRUE;