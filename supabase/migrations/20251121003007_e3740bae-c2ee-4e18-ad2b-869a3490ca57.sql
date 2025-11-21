-- Primero, necesitamos crear el usuario en auth.users
-- IMPORTANTE: Esta migración requiere que ejecutes el siguiente comando manualmente
-- en el SQL Editor de Supabase porque necesitamos crear el usuario en auth.users

-- Paso 1: Crear el usuario administrador
-- Ejecuta esto en el SQL Editor de Supabase:
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insertar usuario en auth.users (esto requiere permisos de servicio)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@diegcutz.app',
    crypt('DiegCutz#2025Pro', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', 'Diego Admin', 'username', 'diego', 'contact_method', 'email', 'contact_value', 'admin@diegcutz.app'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_user_id;

  -- Insertar perfil en public.profiles (esto se hace automáticamente con el trigger)
  -- El trigger handle_new_user ya debería crear el perfil

  -- Insertar rol de admin en user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin');
END $$;