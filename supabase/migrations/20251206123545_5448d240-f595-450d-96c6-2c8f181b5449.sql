-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can insert loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Anyone can update loyalty rewards" ON public.loyalty_rewards;

-- Recreate as permissive policies (default)
CREATE POLICY "Anyone can insert loyalty rewards" 
ON public.loyalty_rewards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update loyalty rewards" 
ON public.loyalty_rewards 
FOR UPDATE 
USING (true) 
WITH CHECK (true);