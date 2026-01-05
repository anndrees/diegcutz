-- Create function to auto-create preferences when user subscribes (if not exists)
CREATE OR REPLACE FUNCTION public.create_notification_preferences_on_subscribe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS create_notification_preferences_on_push_subscribe ON public.push_subscriptions;

-- Trigger to create preferences when push subscription is created
CREATE TRIGGER create_notification_preferences_on_push_subscribe
AFTER INSERT ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_preferences_on_subscribe();