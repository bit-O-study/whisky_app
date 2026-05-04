-- Purpose:
-- Track per-liquor detail-page view counts so the catalog popular sort can
-- blend real user interest with vendor breadth.
--
-- Apply once via Supabase SQL editor (or via the pg-runner shipped in this repo).

alter table public.liquor
    add column if not exists view_count integer not null default 0;

create index if not exists idx_liquor_view_count
    on public.liquor (view_count desc);

-- atomic +1 so concurrent detail-page hits never lose updates.
create or replace function public.increment_liquor_view_count(p_liquor_id bigint)
returns integer
language sql
volatile
as $$
  update public.liquor
  set view_count = view_count + 1
  where id = p_liquor_id
  returning view_count;
$$;
