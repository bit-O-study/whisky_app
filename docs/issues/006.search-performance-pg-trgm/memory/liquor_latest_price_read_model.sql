-- Purpose:
-- 1. Add a read model that returns one latest-price row per liquor.
-- 2. Let catalog search avoid the secondary liquor_price lookup query.
--
-- Notes:
-- - The supporting index should exist before creating the view.
-- - The application can query this view directly and still keep the same
--   catalog response shape.

create index concurrently if not exists idx_liquor_price_lookup
on public.liquor_price (liquor_id, crawled_at desc);

create or replace view public.liquor_catalog_latest_price as
select distinct on (lp.liquor_id)
  l.id,
  l.normalized_name,
  l.brand,
  l.category,
  l.volume_ml,
  l.alcohol_percent,
  l.country,
  l.product_code,
  l.product_name,
  l.product_url,
  l.image_url,
  l.updated_at,
  lp.source,
  lp.current_price,
  lp.original_price,
  lp.crawled_at
from public.liquor_price lp
join public.liquor l on l.id = lp.liquor_id
order by lp.liquor_id, lp.crawled_at desc;

analyze public.liquor_price;
