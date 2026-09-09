do $$
declare
  t text;
  tables text[] := array[
    'sources','articles','categories','topics','regions','homepage_sections','site_settings',
    'official_sources','video_channels','source_regions','article_categories','article_topics','admin_audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', 'admin full access', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (((select auth.jwt()) -> ''app_metadata'' ->> ''role'') = ''admin'') with check (((select auth.jwt()) -> ''app_metadata'' ->> ''role'') = ''admin'')',
      'admin full access', t
    );
  end loop;
end $$;
