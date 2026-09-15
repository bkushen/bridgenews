alter table public.articles
  add column if not exists image_recovery_attempts integer not null default 0,
  add column if not exists image_recovery_attempted_at timestamptz,
  add column if not exists image_recovery_last_error text;

alter table public.articles
  drop constraint if exists articles_image_recovery_attempts_nonnegative;
alter table public.articles
  add constraint articles_image_recovery_attempts_nonnegative
  check (image_recovery_attempts >= 0);

create index if not exists articles_image_recovery_queue_idx
  on public.articles (image_recovery_attempted_at asc nulls first, discovered_at desc)
  where status in ('review_required','discovered') and coalesce(image_url, '') = '';

comment on column public.articles.image_recovery_attempts is 'Number of real publisher image recovery attempts.';
comment on column public.articles.image_recovery_attempted_at is 'Most recent publisher image recovery attempt time.';
comment on column public.articles.image_recovery_last_error is 'Most recent image recovery failure reason, when available.';
