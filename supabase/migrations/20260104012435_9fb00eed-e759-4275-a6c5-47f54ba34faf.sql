
-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon_uses table to track who used which coupon
CREATE TABLE public.coupon_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coupon fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
ADD COLUMN discount_amount NUMERIC DEFAULT 0,
ADD COLUMN original_price NUMERIC;

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for coupon_uses
CREATE POLICY "Users can view their own coupon uses" ON public.coupon_uses
  FOR SELECT USING (auth.uid() = user_id OR true);

CREATE POLICY "Anyone can insert coupon uses" ON public.coupon_uses
  FOR INSERT WITH CHECK (true);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_total NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_user_uses INTEGER;
  v_result JSON;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon FROM public.coupons 
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true;
  
  IF v_coupon IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Cupón no encontrado');
  END IF;
  
  -- Check start date
  IF v_coupon.start_date > now() THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón aún no está activo');
  END IF;
  
  -- Check end date
  IF v_coupon.end_date IS NOT NULL AND v_coupon.end_date < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ha expirado');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ha alcanzado su límite de usos');
  END IF;
  
  -- Check minimum purchase
  IF p_total < v_coupon.min_purchase THEN
    RETURN json_build_object('valid', false, 'error', 'El mínimo de compra para este cupón es ' || v_coupon.min_purchase || '€');
  END IF;
  
  -- Return valid coupon info
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'description', v_coupon.description,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value
  );
END;
$$;

-- Trigger to update coupon uses count
CREATE OR REPLACE FUNCTION public.update_coupon_uses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons 
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_coupon_uses
AFTER INSERT ON public.coupon_uses
FOR EACH ROW
EXECUTE FUNCTION public.update_coupon_uses();
