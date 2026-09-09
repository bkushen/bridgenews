update public.sources
set logo_url = case slug
  when 'lankadeepa-latest' then 'https://www.lankadeepa.lk/favicon.ico'
  when 'lmd-lk' then 'https://lmd.lk/favicon.ico'
  when 'the-island' then 'https://island.lk/favicon.ico'
  else logo_url
end
where slug in ('lankadeepa-latest','lmd-lk','the-island')
  and logo_url is null;
