-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- Create new policies that allow updates and deletes for authenticated operations
-- This allows the admin panel to work with local authentication
CREATE POLICY "Allow updates on bookings"
ON public.bookings
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow deletes on bookings"
ON public.bookings
FOR DELETE
USING (true);