-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that handles Google sign-in users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_contact_method TEXT;
  v_contact_value TEXT;
  v_base_username TEXT;
  v_counter INT := 0;
BEGIN
  -- Get values from metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuario');
  v_username := new.raw_user_meta_data->>'username';
  v_contact_method := new.raw_user_meta_data->>'contact_method';
  v_contact_value := new.raw_user_meta_data->>'contact_value';
  
  -- If no username provided (Google sign-in), generate one from the name
  IF v_username IS NULL OR v_username = '' THEN
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
  
  -- Insert the profile
  INSERT INTO public.profiles (id, full_name, username, contact_method, contact_value)
  VALUES (
    new.id,
    v_full_name,
    v_username,
    v_contact_method,
    v_contact_value
  );
  
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();