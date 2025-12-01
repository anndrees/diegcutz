-- Create table for business hours configuration
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  is_24h BOOLEAN NOT NULL DEFAULT false,
  time_ranges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Add RLS policies for business hours
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business hours"
  ON public.business_hours
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business hours"
  ON public.business_hours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create table for loyalty rewards (cupones system)
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_bookings INTEGER NOT NULL DEFAULT 0,
  free_cuts_available INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies for loyalty rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty rewards"
  ON public.loyalty_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty rewards"
  ON public.loyalty_rewards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert loyalty rewards"
  ON public.loyalty_rewards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update loyalty rewards"
  ON public.loyalty_rewards
  FOR UPDATE
  USING (true);

-- Create trigger to update loyalty rewards
CREATE OR REPLACE FUNCTION update_loyalty_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed bookings with total_price >= 5
  IF NEW.total_price >= 5 AND NEW.user_id IS NOT NULL THEN
    -- Insert or update loyalty record
    INSERT INTO public.loyalty_rewards (user_id, completed_bookings, free_cuts_available)
    VALUES (NEW.user_id, 1, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      completed_bookings = loyalty_rewards.completed_bookings + 1,
      free_cuts_available = CASE 
        WHEN (loyalty_rewards.completed_bookings + 1) % 10 = 0 
        THEN loyalty_rewards.free_cuts_available + 1
        ELSE loyalty_rewards.free_cuts_available
      END,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_rewards();

-- Insert default business hours (Monday-Friday 9:00-14:00, 17:00-20:00)
INSERT INTO public.business_hours (day_of_week, is_closed, is_24h, time_ranges)
VALUES 
  (1, false, false, '[{"start": "09:00", "end": "14:00"}, {"start": "17:00", "end": "20:00"}]'::jsonb),
  (2, false, false, '[{"start": "09:00", "end": "14:00"}, {"start": "17:00", "end": "20:00"}]'::jsonb),
  (3, false, false, '[{"start": "09:00", "end": "14:00"}, {"start": "17:00", "end": "20:00"}]'::jsonb),
  (4, false, false, '[{"start": "09:00", "end": "14:00"}, {"start": "17:00", "end": "20:00"}]'::jsonb),
  (5, false, false, '[{"start": "09:00", "end": "14:00"}, {"start": "17:00", "end": "20:00"}]'::jsonb),
  (6, false, false, '[{"start": "10:00", "end": "14:00"}]'::jsonb),
  (0, true, false, '[]'::jsonb)
ON CONFLICT (day_of_week) DO NOTHING;