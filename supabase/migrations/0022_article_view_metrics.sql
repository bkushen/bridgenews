create table if not exists public.article_metrics (
  article_id uuid primary key references public.articles(id) on delete cascade,
  view_count bigint not null default 0,
  last_viewed_at timestamptz
);

alter table public.article_metrics enable row level security;

drop policy if exists "Public can read article metrics" on public.article_metrics;
create policy "Public can read article metrics"
on public.article_metrics for select
to anon, authenticated
using (true);

grant select on public.article_metrics to anon, authenticated;

create or replace function public.increment_article_view(target_article_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.article_metrics(article_id, view_count, last_viewed_at)
  values (target_article_id, 1, now())
  on conflict (article_id) do update
  set view_count = public.article_metrics.view_count + 1,
      last_viewed_at = excluded.last_viewed_at;
$$;

revoke all on function public.increment_article_view(uuid) from public;
grant execute on function public.increment_article_view(uuid) to anon, authenticated;
