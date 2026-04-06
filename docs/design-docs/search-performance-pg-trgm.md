# Search Performance With pg_trgm

## 문제
- 카탈로그 검색은 상품명, 정규화명, 브랜드의 부분 일치 검색 성격이 강하다.
- 데이터가 늘수록 기본 인덱스만으로는 체감 성능이 불안정해질 수 있다.

## 방향
- PostgreSQL `pg_trgm` extension과 trigram GIN index를 우선 검토한다.
- 부분 문자열 검색 의미론은 유지한다.
- 필요 시 count 전략과 최신 가격 조회 모델도 함께 조정한다.

## 현재 권장안
- `lower(product_name)`, `lower(normalized_name)`, `lower(brand)`에 trigram index 적용
- `updated_at desc` 보조 index 유지
- 최신 가격 최적화가 필요하면 보조 읽기 모델을 검토할 수 있지만, 현재 `vendors[]` 카탈로그 계약을 대체하지는 않는다.

## 실험 자료
- SQL 참조: [pg_trgm_search_indexes.sql](/home/ubuntu/code/bitO-liquor/docs/references/pg_trgm_search_indexes.sql)
- 벤치마크 초안: [pg_trgm_search_benchmark.sql](/home/ubuntu/code/bitO-liquor/docs/references/pg_trgm_search_benchmark.sql)
- 최신 가격 읽기 모델 초안: [liquor_latest_price_read_model.sql](/home/ubuntu/code/bitO-liquor/docs/references/liquor_latest_price_read_model.sql)

## 남은 리스크
- 실제 운영에 가까운 DB에서 `EXPLAIN ANALYZE`를 아직 수집하지 못했다.
- 단일 최신가 읽기 모델은 검색 실험에는 유리할 수 있지만, 현재 멀티벤더 카드 계약과 충돌하지 않도록 범위를 제한해야 한다.
- 이 항목은 [tech-debt-tracker.md](/home/ubuntu/code/bitO-liquor/docs/exec-plans/tech-debt-tracker.md)에서 추적한다.
