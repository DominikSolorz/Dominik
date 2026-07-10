-- LinkTalk production schema for Supabase.
-- Run this in the Supabase SQL editor, then set config.js with your project URL and public key.
-- First admin: after the first account exists, set it manually in SQL:
-- update public.profiles set role = 'admin' where username = 'your-username';

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Nowy uzytkownik',
  username text unique,
  avatar_url text,
  status_text text default 'Dostepny',
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  is_banned boolean not null default false,
  is_online boolean not null default false,
  read_receipts_enabled boolean not null default true,
  auto_transcribe_voice boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  birth_date date,
  home_address text,
  pesel text,
  data_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_private
add column if not exists birth_date date;

create table if not exists public.profile_private_vault (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_payload text not null,
  key_version text not null default 'v1',
  masked_pesel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('terms', 'privacy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  source text not null default 'app',
  created_at timestamptz not null default now(),
  primary key (user_id, document_type, version)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  owner_id uuid references public.profiles(id) on delete set null,
  theme_id text not null default 'classic',
  theme_accent text not null default '#0f766e',
  theme_wallpaper text not null default 'classic',
  quick_reaction text not null default 'OK',
  pinned_message_id uuid,
  disappearing_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  muted_until timestamptz,
  archived boolean not null default false,
  pinned boolean not null default false,
  last_read_at timestamptz,
  nickname text,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'text' check (type in ('text', 'image', 'video', 'file', 'voice', 'gif', 'sticker', 'system')),
  body text,
  attachment_path text,
  attachment_url text,
  attachment_name text,
  attachment_mime text,
  attachment_size integer,
  voice_duration_seconds integer,
  transcript_text text,
  transcript_language text,
  transcript_status text not null default 'none' check (transcript_status in ('none', 'pending', 'processing', 'ready', 'failed')),
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  description text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);
create index if not exists reports_status_idx on public.reports(status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  false,
  104857600,
  null
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'moderator')
      and p.is_banned = false
  );
$$;

create or replace function private.is_conversation_member(target_conversation uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.conversation_members cm
    join public.profiles p on p.id = cm.user_id
    where cm.conversation_id = target_conversation
      and cm.user_id = target_user
      and p.is_banned = false
  );
$$;

create or replace function public.can_read_message(target_message uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.messages m
    where m.id = target_message
      and private.is_conversation_member(m.conversation_id, (select auth.uid()))
  );
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists profile_private_touch_updated_at on public.profile_private;
create trigger profile_private_touch_updated_at
before update on public.profile_private
for each row execute function public.touch_updated_at();

drop trigger if exists profile_private_vault_touch_updated_at on public.profile_private_vault;
create trigger profile_private_vault_touch_updated_at
before update on public.profile_private_vault
for each row execute function public.touch_updated_at();

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
before update on public.conversations
for each row execute function public.touch_updated_at();

drop trigger if exists friendships_touch_updated_at on public.friendships;
create trigger friendships_touch_updated_at
before update on public.friendships
for each row execute function public.touch_updated_at();

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.profile_private_vault enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_reads enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.can_read_message(uuid) to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, display_name, username, avatar_url, status_text, is_online, read_receipts_enabled, auto_transcribe_voice) on public.profiles to authenticated;
grant update (display_name, username, avatar_url, status_text, is_online, read_receipts_enabled, auto_transcribe_voice, updated_at) on public.profiles to authenticated;
grant select on public.profile_private to authenticated;
grant insert (user_id, full_name, phone, birth_date, home_address, pesel, data_consent_at) on public.profile_private to authenticated;
grant update (full_name, phone, birth_date, home_address, pesel, data_consent_at, updated_at) on public.profile_private to authenticated;
revoke all on public.profile_private_vault from public, anon, authenticated;
grant select, insert, update on public.legal_acceptances to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.conversation_members to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.message_reactions to authenticated;
grant select, insert, update, delete on public.message_reads to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert, update on public.reports to authenticated;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars' and owner = (select auth.uid()));

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and owner = (select auth.uid()))
with check (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and owner = (select auth.uid()));

drop policy if exists "chat_files_select_member" on storage.objects;
create policy "chat_files_select_member"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-files'
  and private.is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
);

drop policy if exists "chat_files_insert_member" on storage.objects;
create policy "chat_files_insert_member"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and owner = (select auth.uid())
  and private.is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
);

drop policy if exists "chat_files_update_own" on storage.objects;
create policy "chat_files_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'chat-files' and owner = (select auth.uid()))
with check (bucket_id = 'chat-files' and owner = (select auth.uid()));

drop policy if exists "chat_files_delete_own" on storage.objects;
create policy "chat_files_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'chat-files' and owner = (select auth.uid()));

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.message_reactions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.message_reads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id and is_banned = false)
with check ((select auth.uid()) = id and is_banned = false);

drop policy if exists "profile_private_select_own_or_admin" on public.profile_private;
create policy "profile_private_select_own_or_admin"
on public.profile_private for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "profile_private_insert_own" on public.profile_private;
create policy "profile_private_insert_own"
on public.profile_private for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profile_private_update_own_or_admin" on public.profile_private;
create policy "profile_private_update_own_or_admin"
on public.profile_private for update
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()))
with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "legal_acceptances_select_own_or_admin" on public.legal_acceptances;
create policy "legal_acceptances_select_own_or_admin"
on public.legal_acceptances for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "legal_acceptances_insert_own" on public.legal_acceptances;
create policy "legal_acceptances_insert_own"
on public.legal_acceptances for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "legal_acceptances_update_own_or_admin" on public.legal_acceptances;
create policy "legal_acceptances_update_own_or_admin"
on public.legal_acceptances for update
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()))
with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member"
on public.conversations for select
to authenticated
using (private.is_conversation_member(id, (select auth.uid())) or public.is_admin());

drop policy if exists "conversations_insert_owner" on public.conversations;
create policy "conversations_insert_owner"
on public.conversations for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "conversations_update_member" on public.conversations;
create policy "conversations_update_member"
on public.conversations for update
to authenticated
using (private.is_conversation_member(id, (select auth.uid())) or public.is_admin())
with check (private.is_conversation_member(id, (select auth.uid())) or public.is_admin());

drop policy if exists "members_select_member" on public.conversation_members;
create policy "members_select_member"
on public.conversation_members for select
to authenticated
using (private.is_conversation_member(conversation_id, (select auth.uid())) or public.is_admin());

drop policy if exists "members_insert_self_or_member" on public.conversation_members;
create policy "members_insert_self_or_member"
on public.conversation_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or private.is_conversation_member(conversation_id, (select auth.uid()))
  or public.is_admin()
);

drop policy if exists "members_update_self" on public.conversation_members;
create policy "members_update_self"
on public.conversation_members for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
on public.messages for select
to authenticated
using (private.is_conversation_member(conversation_id, (select auth.uid())) or public.is_admin());

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member"
on public.messages for insert
to authenticated
with check (sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id, (select auth.uid())));

drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender"
on public.messages for update
to authenticated
using ((sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id, (select auth.uid()))) or public.is_admin())
with check ((sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id, (select auth.uid()))) or public.is_admin());

drop policy if exists "reactions_select_member" on public.message_reactions;
create policy "reactions_select_member"
on public.message_reactions for select
to authenticated
using (public.can_read_message(message_id) or public.is_admin());

drop policy if exists "reactions_insert_own" on public.message_reactions;
create policy "reactions_insert_own"
on public.message_reactions for insert
to authenticated
with check (user_id = (select auth.uid()) and public.can_read_message(message_id));

drop policy if exists "reactions_delete_own" on public.message_reactions;
create policy "reactions_delete_own"
on public.message_reactions for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reads_select_member" on public.message_reads;
create policy "reads_select_member"
on public.message_reads for select
to authenticated
using (public.can_read_message(message_id) or public.is_admin());

drop policy if exists "reads_insert_own" on public.message_reads;
create policy "reads_insert_own"
on public.message_reads for insert
to authenticated
with check (user_id = (select auth.uid()) and public.can_read_message(message_id));

drop policy if exists "reads_update_own" on public.message_reads;
create policy "reads_update_own"
on public.message_reads for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
on public.friendships for select
to authenticated
using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()) or public.is_admin());

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
on public.friendships for insert
to authenticated
with check (requester_id = (select auth.uid()));

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee"
on public.friendships for update
to authenticated
using (addressee_id = (select auth.uid()) or public.is_admin())
with check (addressee_id = (select auth.uid()) or public.is_admin());

drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own"
on public.blocks for all
to authenticated
using (blocker_id = (select auth.uid()) or public.is_admin())
with check (blocker_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports for insert
to authenticated
with check (reporter_id = (select auth.uid()));

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
on public.reports for select
to authenticated
using (reporter_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
on public.reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop function if exists public.is_conversation_member(uuid);
