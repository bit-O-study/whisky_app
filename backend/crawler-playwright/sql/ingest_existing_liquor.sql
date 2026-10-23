-- Existing masters only; runs with the caller's privileges.
create or replace function public.ingest_existing_liquor(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_liquor_id bigint := (p->>'liquorId')::bigint;
  v_source text := upper(p->>'source');
  v_price integer := (p->>'currentPrice')::integer;
  v_original integer := (p->>'originalPrice')::integer;
  v_observed timestamptz := (p->>'observedAt')::timestamptz;
  v_url text := coalesce(p->>'productUrl', '');
begin
  if v_price is null or v_price <= 0 then raise exception 'invalid_current_price'; end if;
  if v_source is null or v_source not in ('LOTTEON','EMART','EMART_TRADERS') then raise exception 'invalid_source'; end if;
  if v_observed is null or v_observed > now() + interval '5 minutes' or v_observed < now() - interval '1 day' then
    raise exception 'invalid_observation_time';
  end if;
  perform 1 from public.liquor where id = v_liquor_id for update;
  if not found then raise exception 'existing_liquor_required'; end if;
  if exists(select 1 from public.liquor_price where liquor_id = v_liquor_id and source = v_source
    and crawled_at > (v_observed at time zone 'UTC')) then raise exception 'stale_observation'; end if;

  insert into public.liquor_price(liquor_id,source,current_price,original_price,crawled_at)
  values(v_liquor_id,v_source,v_price,greatest(coalesce(v_original,v_price),v_price),v_observed at time zone 'UTC')
  on conflict(liquor_id,source) do update set current_price=excluded.current_price,
    original_price=excluded.original_price,crawled_at=excluded.crawled_at;

  if v_url <> '' then
    if v_source = 'LOTTEON' and v_url !~ '^https://(www\.)?lotteon\.com/p/product/[A-Za-z0-9]+' then
      raise exception 'invalid_lotteon_url';
    end if;
    update public.liquor_url set product_url=v_url,image_url=coalesce(nullif(p->>'imageUrl',''),image_url)
      where liquor_id=v_liquor_id and source=v_source;
    if not found then
      insert into public.liquor_url(liquor_id,source,product_url,image_url)
      values(v_liquor_id,v_source,v_url,nullif(p->>'imageUrl',''));
    end if;
  end if;
  insert into public.liquor_price_history(liquor_id,source,current_price,original_price,crawled_at)
  select v_liquor_id,v_source,v_price,greatest(coalesce(v_original,v_price),v_price),v_observed
  where not exists(select 1 from public.liquor_price_history
    where liquor_id=v_liquor_id and source=v_source and crawled_at=v_observed);
  return jsonb_build_object('liquorId',v_liquor_id,'observedAt',v_observed);
end;
$$;
revoke all on function public.ingest_existing_liquor(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_existing_liquor(jsonb) to service_role;
