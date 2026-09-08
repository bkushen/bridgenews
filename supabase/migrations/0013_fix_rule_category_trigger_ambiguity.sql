create or replace function public.assign_rule_based_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_slug text;
  category_slug text := 'news';
  v_category_id uuid;
  haystack text;
begin
  select s.slug into source_slug from public.sources s where s.id = new.source_id;
  haystack := lower(coalesce(new.title, '') || ' ' || coalesce(new.description, ''));

  if source_slug like '%business%' or haystack ~ '(business|economy|market|finance|bank|trade|company|companies)' then
    category_slug := 'business';
  elsif haystack ~ '(technology|\\btech\\b|artificial intelligence|\\bai\\b|software|cyber|digital)' then
    category_slug := 'technology';
  elsif haystack ~ '(university|universities|school|student|education|degree|college)' then
    category_slug := 'education';
  elsif haystack ~ '(cricket|football|rugby|tennis|sport|sports|match|tournament)' then
    category_slug := 'sport';
  elsif haystack ~ '(visa|migration|migrant|immigration|citizenship|permanent residency)' then
    category_slug := 'migration';
  elsif haystack ~ '(health|hospital|medical|doctor|disease|virus|vaccine)' then
    category_slug := 'health';
  elsif haystack ~ '(election|parliament|minister|president|government|politics|political)' then
    category_slug := 'politics';
  elsif haystack ~ '(science|research|space|climate|scientist)' then
    category_slug := 'science';
  elsif haystack ~ '(movie|film|music|celebrity|entertainment|television)' then
    category_slug := 'entertainment';
  end if;

  select c.id into v_category_id
  from public.categories c
  where c.slug = category_slug
  limit 1;

  if v_category_id is not null then
    insert into public.article_categories(article_id, category_id, confidence)
    values (new.id, v_category_id, 0.55)
    on conflict (article_id, category_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.assign_rule_based_category() from public, anon, authenticated;
