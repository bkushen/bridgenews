create or replace function public.assign_rule_based_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_slug text;
  category_slug text := 'news';
  category_id uuid;
  haystack text;
begin
  select s.slug into source_slug from public.sources s where s.id = new.source_id;
  haystack := lower(coalesce(new.title, '') || ' ' || coalesce(new.description, ''));

  if source_slug like '%business%' or haystack ~ '(business|economy|market|finance|bank|trade|company|companies)' then category_slug := 'business';
  elsif haystack ~ '(technology|\btech\b|artificial intelligence|\bai\b|software|cyber|digital)' then category_slug := 'technology';
  elsif haystack ~ '(university|universities|school|student|education|degree|college)' then category_slug := 'education';
  elsif haystack ~ '(cricket|football|rugby|tennis|sport|sports|match|tournament)' then category_slug := 'sport';
  elsif haystack ~ '(visa|migration|migrant|immigration|citizenship|permanent residency)' then category_slug := 'migration';
  elsif haystack ~ '(health|hospital|medical|doctor|disease|virus|vaccine)' then category_slug := 'health';
  elsif haystack ~ '(election|parliament|minister|president|government|politics|political)' then category_slug := 'politics';
  elsif haystack ~ '(science|research|space|climate|scientist)' then category_slug := 'science';
  elsif haystack ~ '(movie|film|music|celebrity|entertainment|television)' then category_slug := 'entertainment';
  end if;

  select c.id into category_id from public.categories c where c.slug = category_slug limit 1;
  if category_id is not null then
    insert into public.article_categories(article_id, category_id, confidence)
    values (new.id, category_id, 0.55)
    on conflict (article_id, category_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_rule_category on public.articles;
create trigger articles_rule_category after insert on public.articles for each row execute function public.assign_rule_based_category();

insert into public.article_categories(article_id, category_id, confidence)
select a.id, c.id, 0.55
from public.articles a
join public.sources s on s.id = a.source_id
join public.categories c on c.slug = case
  when s.slug like '%business%' or lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(business|economy|market|finance|bank|trade|company|companies)' then 'business'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(technology|\btech\b|artificial intelligence|\bai\b|software|cyber|digital)' then 'technology'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(university|universities|school|student|education|degree|college)' then 'education'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(cricket|football|rugby|tennis|sport|sports|match|tournament)' then 'sport'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(visa|migration|migrant|immigration|citizenship|permanent residency)' then 'migration'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(health|hospital|medical|doctor|disease|virus|vaccine)' then 'health'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(election|parliament|minister|president|government|politics|political)' then 'politics'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(science|research|space|climate|scientist)' then 'science'
  when lower(coalesce(a.title,'') || ' ' || coalesce(a.description,'')) ~ '(movie|film|music|celebrity|entertainment|television)' then 'entertainment'
  else 'news'
end
where not exists (select 1 from public.article_categories ac where ac.article_id = a.id)
on conflict (article_id, category_id) do nothing;
