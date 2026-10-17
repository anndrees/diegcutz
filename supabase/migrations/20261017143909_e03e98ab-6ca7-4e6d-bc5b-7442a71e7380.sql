create table public.golden_campaign(id text primary key default 'golden-v1',status text not null default 'draft',starts_at timestamptz,release_days integer[] not null default array[0,3,6,9,12,15,20],media jsonb not null default '{}',instagram jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant all on public.golden_campaign to service_role;
alter table public.golden_campaign enable row level security;
create policy golden_config_admin on public.golden_campaign for select to authenticated using(public.has_role(auth.uid(),'admin'));
create table public.golden_chapters(id integer primary key,content jsonb not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant all on public.golden_chapters to service_role;
alter table public.golden_chapters enable row level security;
create policy golden_chapters_admin on public.golden_chapters for select to authenticated using(public.has_role(auth.uid(),'admin'));
create table public.golden_progress(user_id uuid primary key references public.profiles(id) on delete cascade,solved text[] not null default '{}',notes text not null default '',connections jsonb not null default '[]',visited_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant select on public.golden_progress to authenticated; grant all on public.golden_progress to service_role;
alter table public.golden_progress enable row level security;
create policy golden_progress_own on public.golden_progress for select to authenticated using(auth.uid()=user_id);
create table public.golden_access(user_id uuid primary key references public.profiles(id) on delete cascade,draft_allowed boolean not null default false,attempts integer not null default 0,window_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant all on public.golden_access to service_role;
alter table public.golden_access enable row level security;
create policy golden_access_own on public.golden_access for select to authenticated using(auth.uid()=user_id);
create table public.golden_visits(id uuid primary key default gen_random_uuid(),code_hash text not null unique,issued_by uuid not null,consumed_by uuid references public.profiles(id) on delete set null,consumed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant all on public.golden_visits to service_role;
alter table public.golden_visits enable row level security;
create policy golden_visits_admin on public.golden_visits for select to authenticated using(public.has_role(auth.uid(),'admin'));
create trigger golden_campaign_updated before update on public.golden_campaign for each row execute function public.update_updated_at_column();
create trigger golden_chapters_updated before update on public.golden_chapters for each row execute function public.update_updated_at_column();
create trigger golden_progress_updated before update on public.golden_progress for each row execute function public.update_updated_at_column();
create trigger golden_access_updated before update on public.golden_access for each row execute function public.update_updated_at_column();
create trigger golden_visits_updated before update on public.golden_visits for each row execute function public.update_updated_at_column();
insert into public.golden_campaign(id) values('golden-v1');
create or replace function public.golden_action(op text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); cfg public.golden_campaign; prog public.golden_progress; access_row public.golden_access; ch record; deduction jsonb; chapters jsonb:='[]'; safe_content jsonb; normalized text; code text; card public.golden_visits; chapter_id integer; previous_count integer; release_at timestamptz; allowed boolean; isadmin boolean; data jsonb;
begin
if uid is null then return jsonb_build_object('error','Inicia sesión para abrir el expediente.','code','auth'); end if;
isadmin:=public.has_role(uid,'admin');
select * into cfg from public.golden_campaign where id='golden-v1';
insert into public.golden_access(user_id) values(uid) on conflict do nothing;
select * into access_row from public.golden_access where user_id=uid for update;
if access_row.window_at < now()-interval '1 minute' then update public.golden_access set attempts=0,window_at=now() where user_id=uid; access_row.attempts:=0; end if;
if op in ('unlock','answer','visit') then
 if access_row.attempts>=10 then return jsonb_build_object('error','Espera un minuto antes de volver a intentarlo.','code','rate'); end if;
 update public.golden_access set attempts=attempts+1 where user_id=uid;
end if;
if op='unlock' then
 if payload->>'pin'='0529' then update public.golden_access set draft_allowed=true where user_id=uid; access_row.draft_allowed:=true;
 else return jsonb_build_object('error','Código incorrecto.','code','pin'); end if;
end if;
if op like 'admin_%' then
 if not isadmin then return jsonb_build_object('error','Esta gestión requiere una cuenta de administrador verificada.','code','admin'); end if;
 if op='admin_save' then
  if coalesce(payload->>'status','') not in ('draft','active','closed') then return jsonb_build_object('error','Estado no válido.'); end if;
  if payload->>'status'='active' and (payload->>'starts_at' is null or (select count(*) from public.golden_chapters)<>7) then return jsonb_build_object('error','Configura la fecha y los siete expedientes antes de activar.'); end if;
  update public.golden_campaign set status=payload->>'status',starts_at=nullif(payload->>'starts_at','')::timestamptz,media=coalesce(payload->'media','{}'),instagram=coalesce(payload->'instagram','{}') where id=cfg.id;
 elsif op='admin_card' then
  code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
  insert into public.golden_visits(code_hash,issued_by) values(md5(code),uid);
  return jsonb_build_object('card',code);
 end if;
 select * into cfg from public.golden_campaign where id='golden-v1';
 return jsonb_build_object('config',to_jsonb(cfg),'stats',jsonb_build_object('players',(select count(*) from public.golden_progress),'visits',(select count(*) from public.golden_progress where visited_at is not null),'completed',(select count(*) from public.golden_progress where completed_at is not null)));
end if;
if cfg.status='closed' then return jsonb_build_object('error','El expediente está cerrado.','code','closed'); end if;
if cfg.status='draft' and not access_row.draft_allowed then return jsonb_build_object('locked',true,'status','draft'); end if;
insert into public.golden_progress(user_id) values(uid) on conflict do nothing;
select * into prog from public.golden_progress where user_id=uid for update;
if op='visit' then
 code:=upper(regexp_replace(coalesce(payload->>'card',''),'[^a-zA-Z0-9]','','g'));
 select * into card from public.golden_visits where code_hash=md5(code) for update;
 if card.id is null or card.consumed_at is not null then return jsonb_build_object('error','La tarjeta no existe o ya fue utilizada.','code','visit'); end if;
 update public.golden_visits set consumed_by=uid,consumed_at=now() where id=card.id;
 update public.golden_progress set visited_at=coalesce(visited_at,now()) where user_id=uid;
 prog.visited_at:=now();
elsif op='notes' then
 if length(coalesce(payload->>'notes',''))>12000 or jsonb_typeof(coalesce(payload->'connections','[]'))<>'array' or jsonb_array_length(coalesce(payload->'connections','[]'))>120 then return jsonb_build_object('error','El cuaderno supera el límite.'); end if;
 update public.golden_progress set notes=coalesce(payload->>'notes',''),connections=coalesce(payload->'connections','[]') where user_id=uid;
elsif op='answer' then
 chapter_id:=(payload->>'chapter')::integer;
 if chapter_id<1 or chapter_id>7 then return jsonb_build_object('error','Expediente no válido.'); end if;
 select count(*) into previous_count from public.golden_chapters c cross join lateral jsonb_array_elements(c.content->'deductions') d where c.id<chapter_id and (d->>'id')=any(prog.solved);
 if previous_count<>(chapter_id-1)*4 then return jsonb_build_object('error','Resuelve antes los expedientes anteriores.'); end if;
 release_at:=cfg.starts_at+make_interval(days=>cfg.release_days[chapter_id]);
 if cfg.status='active' and (release_at is null or release_at>now()) then return jsonb_build_object('error','Esta entrega todavía no está abierta.'); end if;
 if chapter_id>=3 and prog.visited_at is null then return jsonb_build_object('error','Recoge tu tarjeta gratuita de investigación en el local.','code','visit'); end if;
 select d into deduction from public.golden_chapters c cross join lateral jsonb_array_elements(c.content->'deductions') d where c.id=chapter_id and d->>'id'=payload->>'deduction';
 if deduction is null then return jsonb_build_object('error','Deducción no válida.'); end if;
 normalized:=lower(trim(coalesce(payload->>'answer','')));
 if length(normalized)>160 then return jsonb_build_object('error','Respuesta demasiado larga.'); end if;
 if not exists(select 1 from jsonb_array_elements_text(deduction->'answers') a where lower(trim(a))=normalized) then return jsonb_build_object('error','La hipótesis no encaja con las pruebas.','code','wrong'); end if;
 if not (deduction->>'id')=any(prog.solved) then update public.golden_progress set solved=array_append(solved,deduction->>'id') where user_id=uid; end if;
end if;
select * into prog from public.golden_progress where user_id=uid;
if cardinality(prog.solved)=28 and prog.visited_at is not null then update public.golden_progress set completed_at=coalesce(completed_at,now()) where user_id=uid; select * into prog from public.golden_progress where user_id=uid; end if;
for ch in select * from public.golden_chapters order by id loop
 select count(*) into previous_count from public.golden_chapters c cross join lateral jsonb_array_elements(c.content->'deductions') d where c.id<ch.id and (d->>'id')=any(prog.solved);
 release_at:=cfg.starts_at+make_interval(days=>cfg.release_days[ch.id]);
 allowed:=previous_count=(ch.id-1)*4 and (cfg.status='draft' or release_at<=now()) and (ch.id<3 or prog.visited_at is not null);
 if allowed then
  safe_content:=ch.content-'deductions';
  select jsonb_agg((d-'answers'-'reasoning')||case when (d->>'id')=any(prog.solved) then jsonb_build_object('reasoning',d->'reasoning') else '{}'::jsonb end) into data from jsonb_array_elements(ch.content->'deductions') d;
  safe_content:=safe_content||jsonb_build_object('deductions',data,'id',ch.id,'available',true);
 else safe_content:=jsonb_build_object('id',ch.id,'title',ch.content->>'title','available',false,'release_at',release_at,'visit_required',ch.id>=3 and prog.visited_at is null); end if;
 chapters:=chapters||jsonb_build_array(safe_content);
end loop;
return jsonb_build_object('chapters',chapters,'progress',to_jsonb(prog),'status',cfg.status,'media',cfg.media,'instagram',cfg.instagram,'admin',isadmin,'room',prog.completed_at is not null);
exception when invalid_text_representation or numeric_value_out_of_range then return jsonb_build_object('error','Revisa los datos introducidos.');
end; $$;
revoke all on function public.golden_action(text,jsonb) from public,anon; grant execute on function public.golden_action(text,jsonb) to authenticated;