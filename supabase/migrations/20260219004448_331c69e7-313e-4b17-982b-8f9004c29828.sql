-- Add permissive SELECT policy so admin panel (without auth) can read push_subscriptions
CREATE POLICY "Anyone can view push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (true);

-- Clean up duplicate push subscriptions for andres, keep only the most recent
DELETE FROM public.push_subscriptions 
WHERE user_id = 'ccb9ac4f-18f7-45a1-9923-edef706dfc78' 
AND id != '9dc8e96b-70d1-4a0e-9bc3-45494851eb22';