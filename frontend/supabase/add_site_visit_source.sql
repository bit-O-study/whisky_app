-- 사이트 방문 유입 경로(어디서 왔나) — 2026-10-14.
-- add_site_visit.sql 다음에 1회 실행. 다시 실행해도 안전하다(if not exists / or replace).
-- Supabase SQL 에디터: https://supabase.com/dashboard/project/jeqvxzkvumkiraclauvo/sql/new
--
-- 실행 전에도 /api/visit 는 path 만으로 계속 기록한다(칸이 없으면 예전 방식으로 다시 넣는다).
-- 실행 전 방문은 source 가 비어 있어 통계에서 '기록 전'으로 보인다.

alter table public.site_visit
    add column if not exists source text,          -- 네이버/구글/카카오톡/인스타그램/직접 방문/기타 …
    add column if not exists referrer_host text,   -- 이전 페이지 호스트만(검색어 등 쿼리는 저장하지 않음)
    add column if not exists utm_source text,
    add column if not exists utm_medium text,
    add column if not exists utm_campaign text;

-- 통합 어드민(BOadmin)이 부르는 집계. 행을 다 내려받지 않고 DB 에서 센다.
-- 서울 날짜 기준 오늘 / 최근 7일 / 최근 N일.
create or replace function public.site_visit_sources(p_days int default 30)
returns table (source text, referrer_host text, today bigint, last7 bigint, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select coalesce(v.source, '기록 전') as source,
           v.referrer_host,
           (v.created_at at time zone 'Asia/Seoul')::date as day
    from public.site_visit v
    where v.created_at >= ((now() at time zone 'Asia/Seoul')::date - (greatest(p_days, 1) - 1)) at time zone 'Asia/Seoul'
  ),
  today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select b.source,
         b.referrer_host,
         count(*) filter (where b.day = t.d) as today,
         count(*) filter (where b.day > t.d - 7) as last7,
         count(*) as total
  from base b cross join today t
  group by b.source, b.referrer_host
  order by total desc;
$$;

-- 서버(service_role)만 부른다. 익명·로그인 사용자에게는 열지 않는다.
revoke all on function public.site_visit_sources(int) from public, anon, authenticated;
grant execute on function public.site_visit_sources(int) to service_role;
