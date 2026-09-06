create or replace function public.stream_public_goal_progress(p_username text)
returns table(title text, target_grosz integer, current_grosz bigint)
language sql
stable
security definer
set search_path = public
as $$
  select g.title, g.target_grosz,
         coalesce(sum(d.amount_grosz) filter (where d.status = 'paid'), 0)::bigint as current_grosz
  from public.stream_profiles p
  join public.stream_goals g on g.profile_id = p.id and g.active = true
  left join public.stream_donations d on d.creator_profile_id = p.id
  where p.username = p_username and p.page_enabled = true
  group by g.id, g.title, g.target_grosz, g.created_at
  order by g.created_at desc
  limit 1;
$$;
revoke all on function public.stream_public_goal_progress(text) from public;
grant execute on function public.stream_public_goal_progress(text) to anon, authenticated;
