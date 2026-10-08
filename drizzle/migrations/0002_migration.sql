
create or replace function public.daily_totals(_from date, _to date)
returns table(stat_date date, entries bigint, exits bigint, revenue numeric)
language sql stable security invoker set search_path=public as $$
  select stat_date, sum(entries), sum(exits), sum(revenue) from public.parking_hourly
  where stat_date between _from and _to group by stat_date order by stat_date
$$;
grant execute on function public.daily_totals(date,date) to authenticated;
