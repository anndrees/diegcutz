CREATE TABLE public.home_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  filter text NOT NULL DEFAULT 'none',
  crop jsonb NOT NULL DEFAULT '{"scale":1,"x":0,"y":0}'::jsonb,
  overlays jsonb NOT NULL DEFAULT '[]'::jsonb,
  link_url text,
  link_label text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_stories TO anon, authenticated;
GRANT ALL ON public.home_stories TO service_role;
ALTER TABLE public.home_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stories" ON public.home_stories FOR SELECT USING (true);
CREATE POLICY "Admin manages stories insert" ON public.home_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manages stories update" ON public.home_stories FOR UPDATE USING (true);
CREATE POLICY "Admin manages stories delete" ON public.home_stories FOR DELETE USING (true);