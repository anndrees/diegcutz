-- Add profile_complete column to track if profile has required info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT true;

-- Set profile_complete to false for users without phone/valid contact (Google users)
UPDATE public.profiles 
SET profile_complete = false 
WHERE contact_method = 'email' 
  AND (contact_value IS NULL OR contact_value = '' OR contact_value LIKE '%@%');

-- Actually, we want to mark incomplete profiles based on whether they have a phone number
-- Users who registered via Google with email as contact_value should complete their profile
-- Let's be more specific: if contact_method is 'email' and was created via Google, mark as incomplete
-- For now, mark as incomplete if contact_method is 'email' (Google users default to email)
-- Users can still complete their profile by adding a phone

-- Update the handle_new_user function to set profile_complete based on registration method
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_contact_method TEXT;
  v_contact_value TEXT;
  v_base_username TEXT;
  v_counter INT := 0;
  v_is_oauth BOOLEAN := false;
  v_profile_complete BOOLEAN := true;
BEGIN
  -- Get values from metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuario');
  v_username := new.raw_user_meta_data->>'username';
  v_contact_method := new.raw_user_meta_data->>'contact_method';
  v_contact_value := new.raw_user_meta_data->>'contact_value';
  
  -- Check if this is an OAuth sign-in (no username provided means OAuth)
  IF v_username IS NULL OR v_username = '' THEN
    v_is_oauth := true;
    
    -- Create base username from full name (lowercase, only alphanumeric and underscore)
    v_base_username := lower(regexp_replace(split_part(v_full_name, ' ', 1), '[^a-z0-9_]', '', 'gi'));
    
    -- Ensure minimum length
    IF length(v_base_username) < 3 THEN
      v_base_username := 'user';
    END IF;
    
    -- Try the base username first
    v_username := v_base_username;
    
    -- Check if it exists and add numbers if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
      v_counter := v_counter + 1;
      v_username := v_base_username || v_counter::TEXT;
    END LOOP;
  END IF;
  
  -- If no contact method provided (Google sign-in), use email
  IF v_contact_method IS NULL OR v_contact_method = '' THEN
    v_contact_method := 'email';
  END IF;
  
  -- If no contact value provided (Google sign-in), use email
  IF v_contact_value IS NULL OR v_contact_value = '' THEN
    v_contact_value := new.email;
  END IF;
  
  -- For OAuth users, profile is incomplete (they need to add phone number)
  IF v_is_oauth THEN
    v_profile_complete := false;
  END IF;
  
  -- Insert the profile
  INSERT INTO public.profiles (id, full_name, username, contact_method, contact_value, profile_complete)
  VALUES (
    new.id,
    v_full_name,
    v_username,
    v_contact_method,
    v_contact_value,
    v_profile_complete
  );
  
  RETURN new;
END;
$function$;