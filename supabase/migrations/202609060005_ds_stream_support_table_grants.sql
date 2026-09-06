grant usage on schema public to anon, authenticated;

grant select on public.stream_profiles to anon, authenticated;
grant update on public.stream_profiles to authenticated;

grant select on public.stream_payment_methods to anon, authenticated;
grant insert, update, delete on public.stream_payment_methods to authenticated;

grant select on public.stream_goals to anon, authenticated;
grant insert, update, delete on public.stream_goals to authenticated;

grant select on public.stream_alert_settings to anon, authenticated;
grant insert, update, delete on public.stream_alert_settings to authenticated;

grant select on public.stream_events to anon, authenticated;

grant select on public.stream_donations to authenticated;
grant select, insert, update, delete on public.stream_integrations to authenticated;
grant select, insert, update, delete on public.stream_moderators to authenticated;
grant select, insert, update, delete on public.stream_blocked_terms to authenticated;
