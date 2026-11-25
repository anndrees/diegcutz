do $$ declare r record; begin
for r in select tablename, policyname from pg_policies where schemaname='public' and tablename in ('achievements','admin_action_logs','app_settings','bookings','business_hours','chat_conversations','chat_messages','coupon_uses','coupons','giveaway_participants','giveaways','home_stories','loyalty_rewards','marquee_items','membership_history','membership_surveys','memberships','optional_addons','password_reset_requests','profiles','push_subscriptions','ratings','services','special_hours','user_achievements','user_memberships') loop
 execute format('drop policy %I on public.%I', r.policyname, r.tablename);
end loop; end $$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select public.has_role(auth.uid(),'admin') $$;

-- catalog tables
do $$ declare t text; begin
foreach t in array array['achievements','app_settings','business_hours','giveaways','home_stories','marquee_items','memberships','optional_addons','services','special_hours'] loop
 execute format('create policy "Public read" on public.%I for select using (true)', t);
 execute format('create policy "Admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
end loop; end $$;

-- admin only
do $$ declare t text; begin
foreach t in array array['admin_action_logs','coupons','password_reset_requests'] loop
 execute format('create policy "Admin only" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
end loop; end $$;

-- owner read, admin write
do $$ declare t text; begin
foreach t in array array['loyalty_rewards','user_memberships','membership_history','coupon_uses'] loop
 execute format('create policy "Owner read" on public.%I for select to authenticated using (user_id = auth.uid() or public.is_admin())', t);
 execute format('create policy "Admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
end loop; end $$;
create policy "Owner insert" on public.coupon_uses for insert to authenticated with check (user_id = auth.uid());

-- profiles
create policy "Own or admin read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Own or admin update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "Admin delete" on public.profiles for delete to authenticated using (public.is_admin());

create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or public.is_admin() then return new; end if;
 if new.is_banned is distinct from old.is_banned or new.ban_reason is distinct from old.ban_reason or new.banned_at is distinct from old.banned_at
  or new.is_restricted is distinct from old.is_restricted or new.restriction_ends_at is distinct from old.restriction_ends_at or new.restricted_at is distinct from old.restricted_at
  or new.loyalty_token is distinct from old.loyalty_token or new.pwa_installed_at is distinct from old.pwa_installed_at and old.pwa_installed_at is not null
  or (new.temp_password is distinct from old.temp_password and new.temp_password is not null)
  or (new.temp_password_active and not coalesce(old.temp_password_active,false)) then
  raise exception 'No puedes cambiar estos datos';
 end if;
 return new;
end $$;
drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields before update on public.profiles for each row execute function public.protect_profile_fields();

-- bookings
create policy "Own or admin read" on public.bookings for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Own or admin insert" on public.bookings for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
create policy "Own or admin update" on public.bookings for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Admin delete" on public.bookings for delete to authenticated using (public.is_admin());

create or replace function public.protect_booking_fields() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or public.is_admin() then return new; end if;
 if new.user_id is distinct from old.user_id or new.total_price is distinct from old.total_price or new.original_price is distinct from old.original_price
  or new.discount_amount is distinct from old.discount_amount or new.coupon_id is distinct from old.coupon_id or new.services is distinct from old.services
  or new.service_ids is distinct from old.service_ids or new.loyalty_credited is distinct from old.loyalty_credited or new.loyalty_credited_by is distinct from old.loyalty_credited_by
  or new.client_name is distinct from old.client_name or new.client_contact is distinct from old.client_contact
  or (old.is_cancelled and not coalesce(new.is_cancelled,false)) then
  raise exception 'No puedes cambiar estos datos de la reserva';
 end if;
 return new;
end $$;
drop trigger if exists protect_booking_fields on public.bookings;
create trigger protect_booking_fields before update on public.bookings for each row execute function public.protect_booking_fields();

-- chat
create policy "Own or admin" on public.chat_conversations for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Own or admin" on public.chat_messages for all to authenticated
 using (public.is_admin() or exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
 with check (public.is_admin() or (sender_type = 'user' and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid())));

-- giveaways participants
create policy "Public read" on public.giveaway_participants for select using (true);
create policy "Own join" on public.giveaway_participants for insert to authenticated with check (user_id = auth.uid());
create policy "Own or admin delete" on public.giveaway_participants for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- surveys
create policy "Own insert" on public.membership_surveys for insert to authenticated with check (user_id = auth.uid());
create policy "Own or admin read" on public.membership_surveys for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- push
create policy "Own or admin read" on public.push_subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Own insert" on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy "Own or admin delete" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ratings
create policy "Public read" on public.ratings for select using (true);
create policy "Own insert" on public.ratings for insert to authenticated with check (user_id = auth.uid());
create policy "Own or admin update" on public.ratings for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Admin delete" on public.ratings for delete to authenticated using (public.is_admin());

-- achievements earned
create policy "Public read" on public.user_achievements for select using (true);
create policy "Admin write" on public.user_achievements for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.password_reset_requests, public.admin_action_logs, public.coupons from anon;

-- safe helpers
create or replace function public.booked_slots(p_from date, p_to date) returns table(booking_date date, booking_time time) language sql stable security definer set search_path=public as $$
 select b.booking_date, b.booking_time from public.bookings b where b.booking_date between p_from and p_to and coalesce(b.is_cancelled,false) = false $$;

create or replace function public.username_taken(p_username text, p_exclude uuid default null) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where username = lower(p_username) and (p_exclude is null or id <> p_exclude)) $$;

create or replace function public.contact_taken(p_contact text, p_exclude uuid default null) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where contact_value = p_contact and (p_exclude is null or id <> p_exclude)) $$;

create or replace function public.login_lookup(p_username text) returns table(id uuid, contact_value text, contact_method text, is_banned boolean, ban_reason text) language sql stable security definer set search_path=public as $$
 select p.id, p.contact_value, p.contact_method, p.is_banned, p.ban_reason from public.profiles p where p.username = lower(p_username) limit 1 $$;

create or replace function public.request_password_reset(p_identifier text) returns void language plpgsql security definer set search_path=public as $$
declare p record; v text := lower(trim(p_identifier)); ph text;
begin
 if length(v) < 2 or length(v) > 80 then raise exception 'Dato no válido'; end if;
 select id, username, contact_value into p from public.profiles where username = v limit 1;
 if p.id is null then
  ph := case when v like '+%' then regexp_replace(v,'\s','','g') else '+34' || regexp_replace(v,'\s','','g') end;
  select id, username, contact_value into p from public.profiles where contact_value = ph limit 1;
 end if;
 if exists(select 1 from public.password_reset_requests where coalesce(username,'') = coalesce(p.username, v) and status='pending' and created_at > now() - interval '10 minutes') then return; end if;
 insert into public.password_reset_requests(user_id, username, contact_value, status) values (p.id, coalesce(p.username, v), coalesce(p.contact_value, p_identifier), 'pending');
end $$;

create or replace function public.tv_snapshot(p_today date) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'queue', coalesce((select jsonb_agg(jsonb_build_object('id',id,'booking_time',booking_time,'client_name',split_part(client_name,' ',1),'services',services) order by booking_time) from public.bookings where booking_date=p_today and coalesce(is_cancelled,false)=false),'[]'),
  'upcoming', coalesce((select jsonb_agg(jsonb_build_object('booking_date',booking_date,'booking_time',booking_time) order by booking_date, booking_time) from (select booking_date, booking_time from public.bookings where booking_date>=p_today and coalesce(is_cancelled,false)=false order by booking_date, booking_time limit 200) u),'[]'),
  'total_bookings', (select count(*) from public.bookings where coalesce(is_cancelled,false)=false),
  'today_bookings', (select count(*) from public.bookings where booking_date=p_today and coalesce(is_cancelled,false)=false),
  'total_clients', (select count(*) from public.profiles),
  'coupons', coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'description',description,'discount_type',discount_type,'discount_value',discount_value)) from (select * from public.coupons where is_active limit 6) c),'[]'),
  'achievements', coalesce((select jsonb_agg(jsonb_build_object('id',ua.id,'awarded_at',ua.awarded_at,'achievement_id',ua.achievement_id,'user_id',ua.user_id,'full_name',split_part(p.full_name,' ',1),'username',p.username) order by ua.awarded_at desc) from (select * from public.user_achievements where awarded_at >= now() - interval '7 days' order by awarded_at desc limit 20) ua left join public.profiles p on p.id=ua.user_id),'[]')
 ) $$;

create or replace function public.member_ranking() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'history', coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'action',action,'created_at',created_at)) from public.membership_history),'[]'),
  'active', coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'membership_id',membership_id,'start_date',start_date)) from public.user_memberships where status='active'),'[]'),
  'profiles', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'full_name',split_part(p.full_name,' ',1))) from public.profiles p where p.id in (select user_id from public.membership_history union select user_id from public.user_memberships)),'[]')
 ) $$;

revoke execute on function public.protect_profile_fields(), public.protect_booking_fields() from public, anon, authenticated;
grant execute on function public.booked_slots(date,date), public.username_taken(text,uuid), public.contact_taken(text,uuid), public.login_lookup(text), public.request_password_reset(text), public.tv_snapshot(date), public.member_ranking(), public.is_admin() to anon, authenticated;