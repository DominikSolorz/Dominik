alter table public.stream_payment_methods add column if not exists configured boolean not null default false;

update public.stream_payment_methods pm
set configured = (p.username = 'dominik-demo' and pm.provider = 'card'),
    enabled = (p.username = 'dominik-demo' and pm.provider = 'card'),
    min_amount_grosz = 5000
from public.stream_profiles p
where pm.profile_id = p.id;

alter table public.stream_payment_methods drop constraint if exists stream_payment_methods_enabled_requires_configured;
alter table public.stream_payment_methods add constraint stream_payment_methods_enabled_requires_configured check (not enabled or configured);

revoke insert, update, delete on public.stream_payment_methods from authenticated;
drop policy if exists stream_payment_methods_owner_insert on public.stream_payment_methods;
drop policy if exists stream_payment_methods_owner_update on public.stream_payment_methods;
drop policy if exists stream_payment_methods_owner_delete on public.stream_payment_methods;

create or replace function public.stream_set_payment_method_enabled(p_method_id uuid, p_enabled boolean)
returns public.stream_payment_methods
language plpgsql
security definer
set search_path = public
as $$
declare result public.stream_payment_methods;
begin
  if not exists (select 1 from public.stream_payment_methods pm join public.stream_profiles p on p.id = pm.profile_id where pm.id = p_method_id and p.user_id = auth.uid()) then raise exception 'forbidden'; end if;
  if p_enabled and not exists (select 1 from public.stream_payment_methods where id = p_method_id and configured = true) then raise exception 'provider_not_configured'; end if;
  update public.stream_payment_methods set enabled = p_enabled, min_amount_grosz = 5000, updated_at = now() where id = p_method_id returning * into result;
  return result;
end;
$$;
revoke all on function public.stream_set_payment_method_enabled(uuid, boolean) from public, anon;
grant execute on function public.stream_set_payment_method_enabled(uuid, boolean) to authenticated;

create or replace function public.stream_seed_profile_defaults(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stream_payment_methods(profile_id, provider, label, configured, enabled, min_amount_grosz, sort_order)
  values
    (p_profile_id,'card','Karty płatnicze',false,false,5000,10),(p_profile_id,'blik','BLIK',false,false,5000,20),(p_profile_id,'bank_transfer','Przelew online',false,false,5000,30),(p_profile_id,'paypal','PayPal',false,false,5000,40),(p_profile_id,'paysafecard','paysafecard',false,false,5000,50),(p_profile_id,'sms_plus','SMS Plus',false,false,5000,60),(p_profile_id,'sms','SMS',false,false,5000,70),(p_profile_id,'sms_full','SMS FULL',false,false,5000,80)
  on conflict (profile_id, provider) do nothing;
  insert into public.stream_alert_settings(profile_id) values (p_profile_id) on conflict (profile_id) do nothing;
  insert into public.stream_integrations(profile_id, provider, enabled) values (p_profile_id,'twitch',false),(p_profile_id,'youtube',false),(p_profile_id,'tiktok',false),(p_profile_id,'discord',false),(p_profile_id,'obs',true),(p_profile_id,'webhook',false) on conflict (profile_id, provider) do nothing;
end;
$$;
