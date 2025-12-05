-- Admin Action Logs table
CREATE TABLE public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert admin logs" ON public.admin_action_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view admin logs" ON public.admin_action_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can delete admin logs" ON public.admin_action_logs FOR DELETE USING (true);

-- Giveaways table
CREATE TABLE public.giveaways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  prize TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_finished BOOLEAN NOT NULL DEFAULT false,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner_name TEXT,
  excluded_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view giveaways" ON public.giveaways FOR SELECT USING (true);
CREATE POLICY "Anyone can insert giveaways" ON public.giveaways FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update giveaways" ON public.giveaways FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete giveaways" ON public.giveaways FOR DELETE USING (true);

-- Giveaway Participants table
CREATE TABLE public.giveaway_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.giveaway_participants FOR SELECT USING (true);
CREATE POLICY "Users can participate" ON public.giveaway_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can delete participants" ON public.giveaway_participants FOR DELETE USING (true);

-- Optional Addons table (for items like "Mascarilla" that appear with packs)
CREATE TABLE public.optional_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.optional_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view addons" ON public.optional_addons FOR SELECT USING (true);
CREATE POLICY "Anyone can insert addons" ON public.optional_addons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update addons" ON public.optional_addons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete addons" ON public.optional_addons FOR DELETE USING (true);

-- Add custom_extras column to services for pack-specific items
ALTER TABLE public.services ADD COLUMN custom_extras JSONB DEFAULT '[]';

-- Insert the existing "Mascarilla facial" addon
INSERT INTO public.optional_addons (name, price, coming_soon) VALUES ('Mascarilla facial', 1.50, true);