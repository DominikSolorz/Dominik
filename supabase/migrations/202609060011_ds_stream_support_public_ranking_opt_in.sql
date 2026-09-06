alter table public.stream_donations add column if not exists show_in_ranking boolean not null default false;

create or replace function public.stream_public_ranking(p_username text, p_limit integer default 10)
returns table(payer_name text, total_grosz bigint, donation_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select left(coalesce(nullif(d.payer_name,''),'Anonim'),80) as payer_name,
         sum(d.amount_grosz)::bigint as total_grosz,
         count(*)::bigint as donation_count
  from public.stream_profiles p
  join public.stream_donations d on d.creator_profile_id=p.id
  where p.username=p_username
    and p.page_enabled=true
    and d.status='paid'
    and d.is_anonymous=false
    and d.show_in_ranking=true
  group by left(coalesce(nullif(d.payer_name,''),'Anonim'),80)
  order by total_grosz desc, donation_count desc
  limit greatest(1,least(coalesce(p_limit,10),50));
$$;
revoke all on function public.stream_public_ranking(text,integer) from public;
grant execute on function public.stream_public_ranking(text,integer) to anon, authenticated;
