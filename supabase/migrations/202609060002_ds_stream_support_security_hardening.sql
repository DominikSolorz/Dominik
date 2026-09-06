create or replace function public.stream_set_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.stream_handle_new_user() from public, anon, authenticated;
revoke all on function public.stream_seed_profile_defaults(uuid) from public, anon, authenticated;
revoke all on function public.stream_emit_donation_event() from public, anon, authenticated;
revoke all on function public.stream_set_updated_at() from public, anon, authenticated;
