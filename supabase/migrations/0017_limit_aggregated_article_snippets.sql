create or replace function public.limit_aggregated_article_snippets()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.description is not null then
    new.description := left(new.description, 700);
  end if;
  if new.ai_summary is not null then
    new.ai_summary := left(new.ai_summary, 700);
  end if;
  return new;
end;
$$;

drop trigger if exists articles_limit_aggregated_snippets on public.articles;
create trigger articles_limit_aggregated_snippets
before insert or update of description, ai_summary on public.articles
for each row execute function public.limit_aggregated_article_snippets();

revoke all on function public.limit_aggregated_article_snippets() from public, anon, authenticated;
