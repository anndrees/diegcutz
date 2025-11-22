-- Create services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('service', 'pack')),
  description TEXT,
  included_service_ids uuid[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can view services
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

-- Only admins can insert/update/delete services
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default services
INSERT INTO public.services (name, price, service_type, description) VALUES
  ('DEGRADADO', 7, 'service', 'Corte degradado profesional'),
  ('CEJAS', 1.5, 'service', 'Arreglo de cejas'),
  ('VACIAR O TEXTURIZADO', 1, 'service', 'Vaciado o texturizado del cabello'),
  ('BARBA', 2, 'service', 'Arreglo de barba'),
  ('DISEÑO', 0.5, 'service', 'Diseño personalizado');

-- Insert default packs
INSERT INTO public.services (name, price, service_type, description) VALUES
  ('PACK FRESH', 8, 'pack', 'Degradado + Cejas'),
  ('PACK URBAN', 8, 'pack', 'Degradado + Diseño + Vaciar'),
  ('PACK FULL STYLE', 9, 'pack', 'Degradado + Diseño + Vaciar + Cejas');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_services_updated_at();