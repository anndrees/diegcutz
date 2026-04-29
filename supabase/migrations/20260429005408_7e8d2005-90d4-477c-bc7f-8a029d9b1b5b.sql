
CREATE TABLE public.marquee_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'cyan',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marquee_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marquee items" ON public.marquee_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert marquee items" ON public.marquee_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update marquee items" ON public.marquee_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete marquee items" ON public.marquee_items FOR DELETE USING (true);

CREATE TRIGGER update_marquee_items_updated_at
BEFORE UPDATE ON public.marquee_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.marquee_items (text, color, sort_order) VALUES
  ('✦ FADES PRECISOS', 'cyan', 1),
  ('★ DESDE MONÓVAR', 'purple', 2),
  ('✦ STREET STYLE', 'cyan', 3),
  ('★ CASH ONLY', 'purple', 4),
  ('✦ BEARD GAME', 'cyan', 5),
  ('★ NEXT-LEVEL LOOK', 'purple', 6),
  ('✦ BOOK NOW', 'cyan', 7),
  ('★ DIEGCUTZ', 'purple', 8);
