
CREATE OR REPLACE FUNCTION public.handle_booking_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_was_free_cut boolean;
  current_completed integer;
  current_free_cuts integer;
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    booking_was_free_cut := OLD.total_price = 0;
    
    IF booking_was_free_cut THEN
      -- Restore the free cut (no max cap - cumulative)
      UPDATE public.loyalty_rewards 
      SET free_cuts_available = free_cuts_available + 1,
          updated_at = now()
      WHERE user_id = OLD.user_id;
    ELSIF OLD.total_price >= 5 THEN
      SELECT completed_bookings, free_cuts_available 
      INTO current_completed, current_free_cuts
      FROM public.loyalty_rewards 
      WHERE user_id = OLD.user_id;
      
      IF current_completed IS NOT NULL AND current_completed > 0 THEN
        UPDATE public.loyalty_rewards 
        SET completed_bookings = GREATEST(completed_bookings - 1, 0),
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
$function$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_booking_deletion ON public.bookings;
CREATE TRIGGER on_booking_deletion
  BEFORE DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_deletion();
