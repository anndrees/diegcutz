
-- Memberships plans table
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text DEFAULT '💈',
  price numeric NOT NULL,
  description text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  free_services_per_month integer NOT NULL DEFAULT 0,
  includes_beard_count integer NOT NULL DEFAULT 0,
  product_discount_percent numeric NOT NULL DEFAULT 0,
  image_consulting boolean NOT NULL DEFAULT false,
  free_product_period_months integer NOT NULL DEFAULT 0,
  free_products_per_period integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_coming_soon boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User memberships (active subscriptions)
CREATE TABLE public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  free_services_remaining integer NOT NULL DEFAULT 0,
  beard_services_remaining integer NOT NULL DEFAULT 0,
  pending_membership_id uuid REFERENCES public.memberships(id),
  renewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active membership per user
CREATE UNIQUE INDEX idx_user_active_membership ON public.user_memberships(user_id) WHERE status = 'active';

-- Status validation trigger
CREATE OR REPLACE FUNCTION public.validate_user_membership_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid membership status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_membership_status
  BEFORE INSERT OR UPDATE ON public.user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_membership_status();

-- Auto-expire memberships trigger
CREATE OR REPLACE FUNCTION public.auto_expire_memberships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If end_date has passed and status is still active, expire it
  IF NEW.status = 'active' AND NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
    -- If there's a pending downgrade membership, activate it
    IF NEW.pending_membership_id IS NOT NULL THEN
      -- Will be handled by application logic
      NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_expire_membership
  BEFORE UPDATE ON public.user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_memberships();

-- RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "Anyone can manage memberships insert" ON public.memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can manage memberships update" ON public.memberships FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage memberships delete" ON public.memberships FOR DELETE USING (true);

CREATE POLICY "Anyone can view user memberships" ON public.user_memberships FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user memberships" ON public.user_memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user memberships" ON public.user_memberships FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete user memberships" ON public.user_memberships FOR DELETE USING (true);

-- Insert default memberships
INSERT INTO public.memberships (name, emoji, price, description, free_services_per_month, includes_beard_count, product_discount_percent, image_consulting, free_product_period_months, free_products_per_period, is_active, is_coming_soon, sort_order, benefits) VALUES
('Basic', '💈', 14.90, 'Membresía Basic', 2, 0, 5, false, 0, 0, true, false, 1, '["2 cortes al mes", "5% descuento en productos"]'::jsonb),
('Fresh Look', '💈', 24.90, 'Membresía Fresh Look', 3, 0, 10, false, 0, 0, true, false, 2, '["Hasta 3 cortes al mes", "10% descuento en productos"]'::jsonb),
('Barber 360º Premium', '💈', 34.90, 'Membresía Barber 360º Premium', 4, 2, 10, true, 2, 1, true, false, 3, '["Hasta 4 servicios mensuales", "Barba incluida en 2 de ellos", "Asesoramiento de imagen", "10% descuento en productos", "1 producto de acabado gratis cada dos meses"]'::jsonb),
('VIP Executive', '💈', 49.90, 'Membresía VIP Executive', 6, -1, 10, true, 2, 2, true, true, 4, '["Hasta 6 servicios mensuales", "Barba ilimitada*", "Asesoramiento de imagen preferente", "10% descuento en productos", "2 productos de acabado gratis cada dos meses"]'::jsonb);
