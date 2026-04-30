-- Purpose:
-- Extend chk_liquor_price_source_new (and the matching history-table check, if any)
-- to permit EMART_TRADERS so that manually-entered Traders prices can be saved
-- alongside crawler-collected EMART/LOTTEON rows without colliding on the
-- (liquor_id, source) unique key.
--
-- Apply once via Supabase SQL editor.

alter table public.liquor_price
    drop constraint if exists chk_liquor_price_source_new;

alter table public.liquor_price
    add constraint chk_liquor_price_source_new
    check (source in ('EMART', 'EMART_TRADERS', 'LOTTEON', 'COSTCO', 'HOMEPLUS'));

alter table public.liquor_price_history
    drop constraint if exists chk_liquor_price_history_source;

alter table public.liquor_price_history
    add constraint chk_liquor_price_history_source
    check (source in ('EMART', 'EMART_TRADERS', 'LOTTEON', 'COSTCO', 'HOMEPLUS'));
