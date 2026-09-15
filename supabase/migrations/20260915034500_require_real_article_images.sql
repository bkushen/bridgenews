update public.articles
set status = 'review_required',
    image_url = null,
    processing_error = 'Image required: waiting for a verified publisher news image',
    raw_metadata = coalesce(raw_metadata, '{}'::jsonb) || jsonb_build_object('image_verified', false, 'image_pending', true)
where status = 'published'
  and (
    image_url is null
    or btrim(image_url) = ''
    or image_url ~* '(ebadge|bestweb|award[-_]?badge|/badge|image_8df7de9e07|atrk\.gif|tracking|pixel|placeholder|favicon|site[-_]?icon)'
  );

alter table public.articles
  drop constraint if exists articles_published_requires_image;

alter table public.articles
  add constraint articles_published_requires_image
  check (status <> 'published' or (image_url is not null and btrim(image_url) <> ''));

create index if not exists articles_image_recovery_idx
  on public.articles (status, published_at desc)
  where image_url is null or btrim(image_url) = '';
