-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  trigger_type TEXT NOT NULL, -- 'manual', 'bookings_count', 'first_booking', 'rating_given', 'giveaway_won', etc.
  trigger_value INTEGER, -- e.g., 10 for "10 bookings"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (which users have which achievements)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  awarded_by TEXT, -- 'system' or admin user id
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can insert achievements" ON public.achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update achievements" ON public.achievements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete achievements" ON public.achievements FOR DELETE USING (true);

-- User achievements policies
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete user achievements" ON public.user_achievements FOR DELETE USING (true);

-- Add playlist_url column to bookings table
ALTER TABLE public.bookings ADD COLUMN playlist_url TEXT;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, trigger_type, trigger_value) VALUES
  ('Primera Visita', 'Bienvenido a la familia. ¡Tu primera cita está reservada!', 'baby', 'first_booking', 1),
  ('Cliente Habitual', 'Has completado 5 citas. ¡Gracias por confiar en nosotros!', 'repeat', 'bookings_count', 5),
  ('Cliente Fiel', '10 cortes y contando. ¡Eres parte de la casa!', 'heart', 'bookings_count', 10),
  ('Veterano', '25 citas completadas. Un auténtico veterano.', 'medal', 'bookings_count', 25),
  ('Leyenda', '50 cortes. Eres una leyenda viva.', 'crown', 'bookings_count', 50),
  ('Centenario', '¡100 citas! Eres historia del establecimiento.', 'gem', 'bookings_count', 100),
  ('Crítico', 'Has dejado tu primera valoración. ¡Tu opinión importa!', 'star', 'rating_given', 1),
  ('Crítico Experto', '5 valoraciones dejadas. Ayudas a mejorar el servicio.', 'message-square-star', 'rating_given', 5),
  ('Afortunado', '¡Ganaste un sorteo! La suerte está de tu lado.', 'clover', 'giveaway_won', 1),
  ('Madrugador', 'Reservaste una cita antes de las 10:00', 'sunrise', 'early_booking', 1),
  ('Noctámbulo', 'Reservaste una cita después de las 20:00', 'moon', 'late_booking', 1),
  ('Fin de Semana', 'Tu primera cita en fin de semana', 'calendar-days', 'weekend_booking', 1),
  ('DJ Personal', 'Añadiste tu propia playlist a una cita', 'music', 'playlist_added', 1),
  ('VIP', 'Cliente VIP - Reconocido por excelencia', 'sparkles', 'manual', NULL),
  ('Influencer', 'Nos ayudas a crecer compartiendo tu experiencia', 'share-2', 'manual', NULL),
  ('OG', 'Uno de los primeros clientes. Un original.', 'badge', 'manual', NULL);

-- Function to check and award achievements automatically
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_booking_count INTEGER;
  user_rating_count INTEGER;
  user_giveaway_wins INTEGER;
  booking_hour INTEGER;
  booking_day INTEGER;
BEGIN
  -- Get counts for the user
  SELECT COUNT(*) INTO user_booking_count 
  FROM public.bookings 
  WHERE user_id = NEW.user_id AND (is_cancelled IS NULL OR is_cancelled = false);
  
  -- Check for booking-related achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true 
    AND trigger_type IN ('first_booking', 'bookings_count', 'early_booking', 'late_booking', 'weekend_booking', 'playlist_added')
  LOOP
    -- Skip if already awarded
    IF EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check conditions based on trigger_type
    IF achievement_record.trigger_type = 'first_booking' AND user_booking_count >= 1 THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
      VALUES (NEW.user_id, achievement_record.id, 'system');
    ELSIF achievement_record.trigger_type = 'bookings_count' AND user_booking_count >= achievement_record.trigger_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
      VALUES (NEW.user_id, achievement_record.id, 'system');
    ELSIF achievement_record.trigger_type = 'early_booking' THEN
      booking_hour := EXTRACT(HOUR FROM NEW.booking_time::time);
      IF booking_hour < 10 THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
        VALUES (NEW.user_id, achievement_record.id, 'system');
      END IF;
    ELSIF achievement_record.trigger_type = 'late_booking' THEN
      booking_hour := EXTRACT(HOUR FROM NEW.booking_time::time);
      IF booking_hour >= 20 THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
        VALUES (NEW.user_id, achievement_record.id, 'system');
      END IF;
    ELSIF achievement_record.trigger_type = 'weekend_booking' THEN
      booking_day := EXTRACT(DOW FROM NEW.booking_date);
      IF booking_day IN (0, 6) THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
        VALUES (NEW.user_id, achievement_record.id, 'system');
      END IF;
    ELSIF achievement_record.trigger_type = 'playlist_added' AND NEW.playlist_url IS NOT NULL AND NEW.playlist_url != '' THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
      VALUES (NEW.user_id, achievement_record.id, 'system');
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check rating achievements
CREATE OR REPLACE FUNCTION public.check_rating_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_rating_count INTEGER;
BEGIN
  -- Get rating count
  SELECT COUNT(*) INTO user_rating_count 
  FROM public.ratings 
  WHERE user_id = NEW.user_id;
  
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true AND trigger_type = 'rating_given'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievement_record.id
    ) AND user_rating_count >= achievement_record.trigger_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
      VALUES (NEW.user_id, achievement_record.id, 'system');
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check giveaway achievements
CREATE OR REPLACE FUNCTION public.check_giveaway_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
BEGIN
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    FOR achievement_record IN 
      SELECT * FROM public.achievements 
      WHERE is_active = true AND trigger_type = 'giveaway_won'
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.user_achievements 
        WHERE user_id = NEW.winner_id AND achievement_id = achievement_record.id
      ) THEN
        INSERT INTO public.user_achievements (user_id, achievement_id, awarded_by)
        VALUES (NEW.winner_id, achievement_record.id, 'system');
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER check_booking_achievements
AFTER INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION public.check_and_award_achievements();

CREATE TRIGGER check_rating_achievements_trigger
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.check_rating_achievements();

CREATE TRIGGER check_giveaway_achievements_trigger
AFTER UPDATE ON public.giveaways
FOR EACH ROW
EXECUTE FUNCTION public.check_giveaway_achievements();