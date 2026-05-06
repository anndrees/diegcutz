
-- Create public storage bucket for homepage assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage', 'homepage', true)
ON CONFLICT (id) DO NOTHING;

-- Permissive policies (admin uses hardcoded auth, mirrors existing RLS pattern)
CREATE POLICY "Public read homepage"
ON storage.objects FOR SELECT
USING (bucket_id = 'homepage');

CREATE POLICY "Public insert homepage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'homepage');

CREATE POLICY "Public update homepage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'homepage');

CREATE POLICY "Public delete homepage"
ON storage.objects FOR DELETE
USING (bucket_id = 'homepage');
