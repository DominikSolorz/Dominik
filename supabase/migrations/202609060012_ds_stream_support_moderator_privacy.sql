drop policy if exists stream_donations_owner_read on public.stream_donations;
create policy stream_donations_owner_read on public.stream_donations
for select to authenticated
using (exists(select 1 from public.stream_profiles p where p.id=creator_profile_id and p.user_id=(select auth.uid())));
