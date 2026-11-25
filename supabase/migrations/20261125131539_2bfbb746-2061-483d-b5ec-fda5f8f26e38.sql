CREATE OR REPLACE FUNCTION public.block_bookings_during_closure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  SELECT value INTO v FROM public.app_settings WHERE key = 'temporary_closure';
  IF v IS NOT NULL AND coalesce((v->>'active')::boolean, false) THEN
    RAISE EXCEPTION 'DIEGCUTZ_TEMPORARY_CLOSURE: Tu reserva no ha sido procesada porque DIEGCUTZ está en periodo de cierre temporal. Motivo: %', coalesce(v->>'reason', 'sin especificar')
      USING ERRCODE = 'P0001', HINT = 'temporary_closure';
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.block_bookings_during_closure() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS block_bookings_during_closure ON public.bookings;
CREATE TRIGGER block_bookings_during_closure BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.block_bookings_during_closure();