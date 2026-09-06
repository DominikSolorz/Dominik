create or replace function public.stream_get_secret(secret_name text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
  order by created_at desc
  limit 1;
$$;

revoke all on function public.stream_get_secret(text) from public, anon, authenticated;
grant execute on function public.stream_get_secret(text) to service_role;
