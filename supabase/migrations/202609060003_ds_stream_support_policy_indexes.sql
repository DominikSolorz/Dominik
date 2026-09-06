create index if not exists stream_events_donation_id_idx on public.stream_events(donation_id);
create index if not exists stream_moderators_user_id_idx on public.stream_moderators(moderator_user_id);

drop policy if exists stream_payment_methods_owner_all on public.stream_payment_methods;
create policy stream_payment_methods_owner_insert on public.stream_payment_methods for insert to authenticated with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_payment_methods_owner_update on public.stream_payment_methods for update to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_payment_methods_owner_delete on public.stream_payment_methods for delete to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));

drop policy if exists stream_goals_owner_all on public.stream_goals;
create policy stream_goals_owner_insert on public.stream_goals for insert to authenticated with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_goals_owner_update on public.stream_goals for update to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_goals_owner_delete on public.stream_goals for delete to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));

drop policy if exists stream_alerts_owner_all on public.stream_alert_settings;
create policy stream_alerts_owner_insert on public.stream_alert_settings for insert to authenticated with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_alerts_owner_update on public.stream_alert_settings for update to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_alerts_owner_delete on public.stream_alert_settings for delete to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));

drop policy if exists stream_moderators_owner_all on public.stream_moderators;
create policy stream_moderators_owner_insert on public.stream_moderators for insert to authenticated with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_moderators_owner_update on public.stream_moderators for update to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
create policy stream_moderators_owner_delete on public.stream_moderators for delete to authenticated using (exists(select 1 from public.stream_profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
