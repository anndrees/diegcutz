-- Allow admins to view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete stale push subscriptions
CREATE POLICY "Admins can delete push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update pwa_installed_at for user who already installed but wasn't tracked
UPDATE public.profiles 
SET pwa_installed_at = '2026-01-05T14:02:51Z'
WHERE id = 'ccb9ac4f-18f7-45a1-9923-edef706dfc78' AND pwa_installed_at IS NULL;