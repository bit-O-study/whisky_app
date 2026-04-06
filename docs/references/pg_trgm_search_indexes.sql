-- Purpose:
-- 1. Enable pg_trgm for partial-string search acceleration.
-- 2. Add trigram indexes for the liquor catalog search columns.
-- 3. Keep the current ILIKE '%keyword%' semantics intact.
--
-- Notes:
-- - Run this on the target Postgres / Supabase database.
-- - `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block.
-- - For large production datasets, prefer a low-traffic window.

create extension if not exists pg_trgm with schema extensions;

create index concurrently if not exists idx_liquor_product_name_trgm
on public.liquor
using gin (product_name gin_trgm_ops)
where product_name is not null;

create index concurrently if not exists idx_liquor_normalized_name_trgm
on public.liquor
using gin (normalized_name gin_trgm_ops)
where normalized_name is not null;

create index concurrently if not exists idx_liquor_brand_trgm
on public.liquor
using gin (brand gin_trgm_ops)
where brand is not null;

-- Keep `updated_at desc` sorting cheap when the filtered set is already small.
create index concurrently if not exists idx_liquor_updated_at_desc
on public.liquor (updated_at desc);

analyze public.liquor;
