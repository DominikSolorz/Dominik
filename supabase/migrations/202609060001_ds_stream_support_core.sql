create extension if not exists pgcrypto;

create table if not exists public.stream_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  banner_url text,
  page_enabled boolean not null default true,
  min_amount_grosz integer not null default 5000 check (min_amount_grosz >= 5000),
  voice_enabled boolean not null default true,
  voice_min_amount_grosz integer not null default 5000 check (voice_min_amount_grosz >= 5000),
  twitch_url text,
  youtube_url text,
  tiktok_url text,
  discord_url text,
  theme jsonb not null default '{"accent":"#7c3aed","mode":"dark"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stream_profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,31}$')
);

create table if not exists public.stream_payment_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  provider text not null,
  label text not null,
  enabled boolean not null default true,
  min_amount_grosz integer not null default 5000 check (min_amount_grosz >= 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, provider)
);

create table if not exists public.stream_donations (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  payer_name text not null default 'Anonim',
  payer_email text,
  is_anonymous boolean not null default false,
  amount_grosz integer not null check (amount_grosz >= 5000),
  currency text not null default 'PLN' check (currency = 'PLN'),
  message text not null default '',
  voice_url text,
  payment_provider text not null,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  moderation_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists stream_donations_provider_reference_uidx on public.stream_donations(provider_reference) where provider_reference is not null;
create index if not exists stream_donations_creator_status_created_idx on public.stream_donations(creator_profile_id, status, created_at desc);
create index if not exists stream_donations_creator_paid_idx on public.stream_donations(creator_profile_id, paid_at desc) where status = 'paid';

create table if not exists public.stream_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  title text not null,
  target_grosz integer not null check (target_grosz >= 5000),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stream_goals_profile_active_idx on public.stream_goals(profile_id, active);

create table if not exists public.stream_alert_settings (
  profile_id uuid primary key references public.stream_profiles(id) on delete cascade,
  enabled boolean not null default true,
  min_amount_grosz integer not null default 5000 check (min_amount_grosz >= 5000),
  duration_ms integer not null default 7000 check (duration_ms between 1000 and 30000),
  show_name boolean not null default true,
  show_message boolean not null default true,
  speak_message boolean not null default true,
  sound_url text,
  animation text not null default 'glow-pop',
  updated_at timestamptz not null default now()
);

create table if not exists public.stream_integrations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  provider text not null,
  enabled boolean not null default false,
  public_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, provider)
);

create table if not exists public.stream_moderators (
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  moderator_user_id uuid not null references auth.users(id) on delete cascade,
  can_moderate_messages boolean not null default true,
  can_moderate_voice boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (profile_id, moderator_user_id)
);

create table if not exists public.stream_blocked_terms (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  term text not null,
  created_at timestamptz not null default now(),
  unique(profile_id, term)
);

create table if not exists public.stream_events (
  id bigint generated always as identity primary key,
  creator_profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  donation_id uuid references public.stream_donations(id) on delete cascade,
  event_type text not null check (event_type in ('donation','voice','goal','system')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists stream_events_creator_created_idx on public.stream_events(creator_profile_id, created_at desc);

create or replace function public.stream_set_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.stream_seed_profile_defaults(p_profile_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.stream_payment_methods(profile_id, provider, label, enabled, min_amount_grosz, sort_order)
  values (p_profile_id,'blik','BLIK',true,5000,10),(p_profile_id,'card','Karty płatnicze',true,5000,20),(p_profile_id,'bank_transfer','Przelew online',true,5000,30),(p_profile_id,'paypal','PayPal',true,5000,40),(p_profile_id,'paysafecard','paysafecard',true,5000,50),(p_profile_id,'sms_plus','SMS Plus',true,5000,60),(p_profile_id,'sms','SMS',true,5000,70),(p_profile_id,'sms_full','SMS FULL',true,5000,80)
  on conflict (profile_id, provider) do nothing;
  insert into public.stream_alert_settings(profile_id) values (p_profile_id) on conflict (profile_id) do nothing;
  insert into public.stream_integrations(profile_id, provider, enabled) values (p_profile_id,'twitch',false),(p_profile_id,'youtube',false),(p_profile_id,'tiktok',false),(p_profile_id,'discord',false),(p_profile_id,'obs',true),(p_profile_id,'webhook',false) on conflict (profile_id, provider) do nothing;
end; $$;

create or replace function public.stream_handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare base_name text; safe_name text; new_profile_id uuid;
begin
  base_name := lower(split_part(coalesce(new.email,'tworca'),'@',1)); safe_name := regexp_replace(base_name,'[^a-z0-9_-]+','-','g'); safe_name := trim(both '-' from safe_name); if length(safe_name)<3 then safe_name:='tworca'; end if; safe_name := left(safe_name,23)||'-'||substr(replace(new.id::text,'-',''),1,8);
  insert into public.stream_profiles(user_id,username,display_name) values(new.id,safe_name,coalesce(new.raw_user_meta_data->>'full_name',split_part(coalesce(new.email,'Twórca'),'@',1))) returning id into new_profile_id;
  perform public.stream_seed_profile_defaults(new_profile_id); return new;
end; $$;

drop trigger if exists stream_on_auth_user_created on auth.users;
create trigger stream_on_auth_user_created after insert on auth.users for each row execute function public.stream_handle_new_user();

create or replace function public.stream_emit_donation_event() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status='paid' and new.moderation_status='approved' and (tg_op='INSERT' or old.status is distinct from 'paid' or old.moderation_status is distinct from 'approved') then
    insert into public.stream_events(creator_profile_id,donation_id,event_type,payload) values(new.creator_profile_id,new.id,case when new.voice_url is null then 'donation' else 'voice' end,jsonb_build_object('name',case when new.is_anonymous then 'Anonim' else left(coalesce(nullif(new.payer_name,''),'Anonim'),50) end,'amount_grosz',new.amount_grosz,'currency',new.currency,'message',left(coalesce(new.message,''),300),'voice_url',new.voice_url));
  end if; return new;
end; $$;

drop trigger if exists stream_donation_event_trigger on public.stream_donations;
create trigger stream_donation_event_trigger after insert or update of status, moderation_status on public.stream_donations for each row execute function public.stream_emit_donation_event();

alter table public.stream_profiles enable row level security; alter table public.stream_payment_methods enable row level security; alter table public.stream_donations enable row level security; alter table public.stream_goals enable row level security; alter table public.stream_alert_settings enable row level security; alter table public.stream_integrations enable row level security; alter table public.stream_moderators enable row level security; alter table public.stream_blocked_terms enable row level security; alter table public.stream_events enable row level security;

create policy stream_profiles_public_read on public.stream_profiles for select to anon, authenticated using (page_enabled or user_id=(select auth.uid()));
create policy stream_profiles_owner_update on public.stream_profiles for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy stream_payment_methods_public_read on public.stream_payment_methods for select to anon, authenticated using ((enabled and exists(select 1 from public.stream_profiles p where p.id=profile_id and p.page_enabled)) or exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_donations_owner_read on public.stream_donations for select to authenticated using (exists(select 1 from public.stream_profiles p where p.id=creator_profile_id and p.user_id=(select auth.uid())) or exists(select 1 from public.stream_moderators m where m.profile_id=creator_profile_id and m.moderator_user_id=(select auth.uid())));
create policy stream_goals_public_read on public.stream_goals for select to anon, authenticated using ((active and exists(select 1 from public.stream_profiles p where p.id=profile_id and p.page_enabled)) or exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_alerts_public_read on public.stream_alert_settings for select to anon, authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.page_enabled) or exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_integrations_owner_all on public.stream_integrations for all to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_moderators_read on public.stream_moderators for select to authenticated using (moderator_user_id=(select auth.uid()) or exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_blocked_terms_owner_all on public.stream_blocked_terms for all to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_events_recent_public_read on public.stream_events for select to anon, authenticated using ((created_at>now()-interval '10 minutes' and exists(select 1 from public.stream_profiles p where p.id=creator_profile_id and p.page_enabled)) or exists(select 1 from public.stream_profiles p where p.id=creator_profile_id and p.user_id=(select auth.uid())));

insert into public.stream_profiles(username,display_name,bio,min_amount_grosz,voice_enabled,voice_min_amount_grosz,twitch_url) values('dominik-demo','Dominik','Wesprzyj gaming, naukę i rozwój Interactive AI Classroom.',5000,true,5000,'https://twitch.tv/zairox') on conflict(username) do update set min_amount_grosz=5000,voice_min_amount_grosz=5000,updated_at=now();
select public.stream_seed_profile_defaults(id) from public.stream_profiles where username='dominik-demo';
insert into public.stream_goals(profile_id,title,target_grosz,active) select id,'Rozwój Interactive AI Classroom',500000,true from public.stream_profiles where username='dominik-demo';

do $$ begin if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='stream_events') then alter publication supabase_realtime add table public.stream_events; end if; end $$;
