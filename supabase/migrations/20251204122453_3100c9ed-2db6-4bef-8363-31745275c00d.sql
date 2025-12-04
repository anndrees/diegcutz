-- Create function to handle booking deletions and update loyalty accordingly
CREATE OR REPLACE FUNCTION public.handle_booking_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_was_free_cut boolean;
  current_completed integer;
  current_free_cuts integer;
BEGIN
  -- Only process if the booking had a user_id and was >= 5€
  IF OLD.user_id IS NOT NULL THEN
    -- Check if this was a free cut (price = 0)
    booking_was_free_cut := OLD.total_price = 0;
    
    IF booking_was_free_cut THEN
      -- If it was a free cut booking, restore the free cut to the user
      UPDATE public.loyalty_rewards 
      SET free_cuts_available = LEAST(free_cuts_available + 1, 1), -- Max 1 because non-cumulative
          updated_at = now()
      WHERE user_id = OLD.user_id;
    ELSIF OLD.total_price >= 5 THEN
      -- If it was a paid booking >= 5€, decrement the completed bookings count
      SELECT completed_bookings, free_cuts_available 
      INTO current_completed, current_free_cuts
      FROM public.loyalty_rewards 
      WHERE user_id = OLD.user_id;
      
      IF current_completed IS NOT NULL AND current_completed > 0 THEN
        -- Calculate if we need to remove a free cut (if they were at 10, 20, 30, etc.)
        UPDATE public.loyalty_rewards 
        SET completed_bookings = GREATEST(completed_bookings - 1, 0),
            -- If they had just earned a free cut at this count, remove it
            free_cuts_available = CASE 
              WHEN current_completed % 10 = 0 AND current_free_cuts > 0
              THEN free_cuts_available - 1
              ELSE free_cuts_available
            END,
            updated_at = now()
        WHERE user_id = OLD.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create the trigger for booking deletions
DROP TRIGGER IF EXISTS on_booking_deleted ON public.bookings;
CREATE TRIGGER on_booking_deleted
  BEFORE DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_deletion();