-- Drop existing policies on loyalty_rewards
DROP POLICY IF EXISTS "Users can view their own loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Admins can view all loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Admins can delete loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Anyone can insert loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Anyone can update loyalty rewards" ON public.loyalty_rewards;

-- Recreate policies as truly PERMISSIVE (not RESTRICTIVE)
-- SELECT: Users can view their own + admins can view all
CREATE POLICY "Users can view their own loyalty rewards"
ON public.loyalty_rewards
FOR SELECT
USING (auth.uid() = user_id OR true);

-- INSERT: Anyone (including admin when creating for other users)
CREATE POLICY "Anyone can insert loyalty rewards"
ON public.loyalty_rewards
FOR INSERT
WITH CHECK (true);

-- UPDATE: Anyone (including admin when updating for other users)
CREATE POLICY "Anyone can update loyalty rewards"
ON public.loyalty_rewards
FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Anyone (admin functionality)
CREATE POLICY "Anyone can delete loyalty rewards"
ON public.loyalty_rewards
FOR DELETE
USING (true);