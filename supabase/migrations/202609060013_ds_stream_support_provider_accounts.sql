create table if not exists public.stream_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.stream_profiles(id) on delete cascade,
  provider text not null,
  external_account_id text not null,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending','restricted','complete','disabled')),
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id,provider),
  unique(provider,external_account_id)
);
alter table public.stream_provider_accounts enable row level security;
grant select on public.stream_provider_accounts to authenticated;
create policy stream_provider_accounts_owner_read on public.stream_provider_accounts for select to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create index if not exists stream_provider_accounts_profile_idx on public.stream_provider_accounts(profile_id);
create trigger stream_provider_accounts_updated_at before update on public.stream_provider_accounts for each row execute function public.stream_set_updated_at();
