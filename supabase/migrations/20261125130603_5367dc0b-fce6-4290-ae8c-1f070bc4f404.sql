create or replace function public.redeem_free_cut() returns boolean language plpgsql security definer set search_path=public as $$
declare n int;
begin
 if auth.uid() is null then return false; end if;
 update public.loyalty_rewards set free_cuts_available = free_cuts_available - 1 where user_id = auth.uid() and free_cuts_available > 0;
 get diagnostics n = row_count; return n > 0;
end $$;
revoke execute on function public.redeem_free_cut() from public, anon;
grant execute on function public.redeem_free_cut() to authenticated;

create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path=public as $$
declare expired boolean := old.is_restricted and old.restriction_ends_at is not null and old.restriction_ends_at <= now() and not coalesce(new.is_restricted,false);
begin
 if auth.uid() is null or public.is_admin() then return new; end if;
 if new.is_banned is distinct from old.is_banned or new.ban_reason is distinct from old.ban_reason or new.banned_at is distinct from old.banned_at
  or (not expired and (new.is_restricted is distinct from old.is_restricted or new.restriction_ends_at is distinct from old.restriction_ends_at or new.restricted_at is distinct from old.restricted_at))
  or new.loyalty_token is distinct from old.loyalty_token
  or (new.pwa_installed_at is distinct from old.pwa_installed_at and old.pwa_installed_at is not null)
  or (new.temp_password is distinct from old.temp_password and new.temp_password is not null)
  or (coalesce(new.temp_password_active,false) and not coalesce(old.temp_password_active,false)) then
  raise exception 'No puedes cambiar estos datos';
 end if;
 return new;
end $$;