create or replace function public.stream_creator_stats()
returns table(profile_id uuid, donation_count bigint, total_grosz bigint, average_grosz numeric, max_grosz integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         count(d.id) filter (where d.status='paid')::bigint,
         coalesce(sum(d.amount_grosz) filter (where d.status='paid'),0)::bigint,
         coalesce(avg(d.amount_grosz) filter (where d.status='paid'),0)::numeric,
         coalesce(max(d.amount_grosz) filter (where d.status='paid'),0)::integer
  from public.stream_profiles p
  left join public.stream_donations d on d.creator_profile_id=p.id
  where p.user_id=auth.uid()
  group by p.id;
$$;
revoke all on function public.stream_creator_stats() from public, anon;
grant execute on function public.stream_creator_stats() to authenticated;
