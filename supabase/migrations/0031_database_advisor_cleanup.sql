-- Clear safe database-advisor findings while preserving intentional server-only behavior.

create schema if not exists extensions;

-- pgvector is relocatable. Existing vector columns keep their type OIDs after relocation.
alter extension vector set schema extensions;

-- Make the intended browser access model explicit for ingestion logs: admins may read them,
-- while ordinary authenticated users and anonymous users still cannot.
drop policy if exists "admin read ingestion runs" on public.ingestion_runs;
create policy "admin read ingestion runs"
on public.ingestion_runs
for select
to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
