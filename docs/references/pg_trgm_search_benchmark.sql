-- Purpose:
-- Compare current search cost before/after applying pg_trgm indexes.
-- Run each block with representative keywords from real data.
--
-- Suggested flow:
-- 1. Run this file before applying indexes and save the output.
-- 2. Apply `pg_trgm_search_indexes.sql`.
-- 3. Run this file again and compare execution time / plan shape.
--
-- Current application query shape:
-- - no exact count
-- - page size 24
-- - fetch one extra row to derive hasNext
-- - order by updated_at desc

-- 1-char search hot path
explain (analyze, buffers)
select
  id,
  normalized_name,
  brand,
  category,
  volume_ml,
  alcohol_percent,
  country,
  product_code,
  product_name,
  product_url,
  image_url,
  updated_at
from public.liquor
where product_name ilike '%m%'
   or normalized_name ilike '%m%'
   or brand ilike '%m%'
order by updated_at desc
limit 25 offset 0;

-- 2-char search hot path
explain (analyze, buffers)
select
  id,
  normalized_name,
  brand,
  category,
  volume_ml,
  alcohol_percent,
  country,
  product_code,
  product_name,
  product_url,
  image_url,
  updated_at
from public.liquor
where product_name ilike '%ma%'
   or normalized_name ilike '%ma%'
   or brand ilike '%ma%'
order by updated_at desc
limit 25 offset 0;

-- 3-char search, expected pg_trgm sweet spot
explain (analyze, buffers)
select
  id,
  normalized_name,
  brand,
  category,
  volume_ml,
  alcohol_percent,
  country,
  product_code,
  product_name,
  product_url,
  image_url,
  updated_at
from public.liquor
where product_name ilike '%mac%'
   or normalized_name ilike '%mac%'
   or brand ilike '%mac%'
order by updated_at desc
limit 25 offset 0;

-- Deep page sample for hasNext/offset behavior
explain (analyze, buffers)
select
  id,
  normalized_name,
  brand,
  category,
  volume_ml,
  alcohol_percent,
  country,
  product_code,
  product_name,
  product_url,
  image_url,
  updated_at
from public.liquor
where product_name ilike '%mac%'
   or normalized_name ilike '%mac%'
   or brand ilike '%mac%'
order by updated_at desc
limit 25 offset 120;

-- Price follow-up query for the selected page ids
-- Replace the ids with real result ids from the search page.
explain (analyze, buffers)
select
  liquor_id,
  source,
  current_price,
  original_price,
  crawled_at
from public.liquor_price
where liquor_id in (1, 2, 3, 4, 5)
order by crawled_at desc;
