create or replace function public.stream_seed_profile_defaults(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stream_payment_methods(profile_id, provider, label, enabled, min_amount_grosz, sort_order)
  values
    (p_profile_id, 'card', 'Karty płatnicze', true, 5000, 10),
    (p_profile_id, 'blik', 'BLIK', false, 5000, 20),
    (p_profile_id, 'bank_transfer', 'Przelew online', false, 5000, 30),
    (p_profile_id, 'paypal', 'PayPal', false, 5000, 40),
    (p_profile_id, 'paysafecard', 'paysafecard', false, 5000, 50),
    (p_profile_id, 'sms_plus', 'SMS Plus', false, 5000, 60),
    (p_profile_id, 'sms', 'SMS', false, 5000, 70),
    (p_profile_id, 'sms_full', 'SMS FULL', false, 5000, 80)
  on conflict (profile_id, provider) do nothing;

  insert into public.stream_alert_settings(profile_id) values (p_profile_id) on conflict (profile_id) do nothing;
  insert into public.stream_integrations(profile_id, provider, enabled)
  values (p_profile_id, 'twitch', false),(p_profile_id, 'youtube', false),(p_profile_id, 'tiktok', false),(p_profile_id, 'discord', false),(p_profile_id, 'obs', true),(p_profile_id, 'webhook', false)
  on conflict (profile_id, provider) do nothing;
end;
$$;

update public.stream_payment_methods pm
set enabled = (pm.provider = 'card'), min_amount_grosz = 5000
from public.stream_profiles p
where pm.profile_id = p.id and p.username = 'dominik-demo';
