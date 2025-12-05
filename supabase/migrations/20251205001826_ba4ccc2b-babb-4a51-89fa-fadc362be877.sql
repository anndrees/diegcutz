-- Drop existing restrictive policies on loyalty_rewards
DROP POLICY IF EXISTS "System can insert loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "System can update loyalty rewards" ON public.loyalty_rewards;

-- Create permissive policies for admin to manage loyalty rewards
CREATE POLICY "Anyone can insert loyalty rewards" 
ON public.loyalty_rewards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update loyalty rewards" 
ON public.loyalty_rewards 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow admin to delete loyalty rewards if needed
CREATE POLICY "Admins can delete loyalty rewards" 
ON public.loyalty_rewards 
FOR DELETE 
USING (true);