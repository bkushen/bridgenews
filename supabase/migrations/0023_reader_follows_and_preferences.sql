create table if not exists public.source_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, source_id)
);

create table if not exists public.topic_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null,
  topic_label text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_key)
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  breaking_news boolean not null default false,
  daily_digest boolean not null default false,
  source_updates boolean not null default false,
  topic_updates boolean not null default false,
  preferred_language text not null default 'all' check (preferred_language in ('all','en','si','ta')),
  updated_at timestamptz not null default now()
);

alter table public.source_follows enable row level security;
alter table public.topic_follows enable row level security;
alter table public.notification_preferences enable row level security;

grant select, insert, delete on public.source_follows to authenticated;
grant select, insert, delete on public.topic_follows to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;

create policy "Users manage own source follows" on public.source_follows
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own topic follows" on public.topic_follows
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own notification preferences" on public.notification_preferences
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists source_follows_user_idx on public.source_follows(user_id, created_at desc);
create index if not exists topic_follows_user_idx on public.topic_follows(user_id, created_at desc);
