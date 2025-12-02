-- Add permissive policies for business_hours management (admin panel uses local auth)
CREATE POLICY "Allow all updates on business hours"
  ON public.business_hours
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all inserts on business hours"
  ON public.business_hours
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all deletes on business hours"
  ON public.business_hours
  FOR DELETE
  USING (true);

-- Add permissive policy for profiles updates (for admin panel)
CREATE POLICY "Allow all updates on profiles"
  ON public.profiles
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow all deletes on profiles"
  ON public.profiles
  FOR DELETE
  USING (true);