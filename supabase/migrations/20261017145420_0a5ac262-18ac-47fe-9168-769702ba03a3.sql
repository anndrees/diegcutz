revoke all on table public.golden_chapters,public.golden_campaign,public.golden_visits,public.golden_access from anon,authenticated;
revoke all on table public.golden_progress from anon,authenticated;
grant select on table public.golden_progress to authenticated;
grant all on table public.golden_chapters,public.golden_campaign,public.golden_visits,public.golden_access,public.golden_progress to service_role;