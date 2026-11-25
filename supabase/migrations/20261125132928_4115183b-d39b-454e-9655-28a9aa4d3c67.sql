INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM public.profiles
WHERE id = 'ccb9ac4f-18f7-45a1-9923-edef706dfc78' AND lower(ltrim(username, '@')) = 'andres'
ON CONFLICT (user_id, role) DO NOTHING;