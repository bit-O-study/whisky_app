# DB Schema Snapshot

## 상태
- 이 문서는 현재 코드와 설계 문서를 기준으로 정리한 스냅샷이다.
- 아직 자동 생성 파이프라인으로 유지되지 않으므로, 실제 생성물로 대체할 작업이 남아 있다.

## 주요 테이블
- `public.liquor`
  상품 기본 정보
- `public.liquor_price`
  판매처별 가격 이력
- `public.liquor_info`
  크롤러 매칭 보조 정보

## 읽기 모델
- `liquor_catalog_latest_price`
  주류당 최신 가격 1건만 반환하는 선택적 읽기 모델 후보
  현재 멀티벤더 카탈로그 기본 계약(`vendors[]`)을 대체하지 않는다.

## 참고 문서
- [supabase-data-model.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/supabase-data-model.md)
- [liquor_latest_price_read_model.sql](/home/ubuntu/code/bitO-liquor/docs/references/liquor_latest_price_read_model.sql)

## 서버 전용 적재 함수 (2026-10-23 운영 확인)
- public.ingest_existing_liquor(jsonb): 기존 상품 가격·URL·이력을 한 트랜잭션에 저장. 가격과 관측 시각을 검증하고 오래된 관측을 거부한다.
- SECURITY INVOKER, search_path 비움, service_role만 EXECUTE 가능. SQL 원본: backend/crawler-playwright/sql/ingest_existing_liquor.sql.
