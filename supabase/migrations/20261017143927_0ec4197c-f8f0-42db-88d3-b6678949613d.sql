alter function public.golden_action(text,jsonb) rename to golden_action_internal;
revoke all on function public.golden_action_internal(text,jsonb) from authenticated,anon,public;
grant execute on function public.golden_action_internal(text,jsonb) to service_role;
create function public.golden_service_action(actor uuid,op text,payload jsonb default '{}') returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$ begin perform set_config('request.jwt.claim.sub',actor::text,true); return public.golden_action_internal(op,payload); end; $$;
revoke all on function public.golden_service_action(uuid,text,jsonb) from public,anon,authenticated; grant execute on function public.golden_service_action(uuid,text,jsonb) to service_role;