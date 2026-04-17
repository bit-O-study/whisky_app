# Implementation Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료
- 작업 진행 시 체크 상태를 즉시 갱신하고, 성능 병목에 대한 판단이 바뀌면 본 문서를 바로 수정한다.

## 방향
- 이번 이슈의 실제 사용자 검색 경로는 Spring `backend/api`가 아니라 Next.js `frontend`의 Supabase 조회 경로다.
- 따라서 1차 최적화 대상은 `frontend/src/features/catalog/api/catalog-server.ts`의 검색 쿼리와 후속 가격 조회다.
- 부분 문자열 검색 의미론은 유지하되, `ILIKE '%keyword%'`가 `pg_trgm` 인덱스를 탈 수 있도록 DB 확장과 인덱스를 먼저 준비한다.
- 성능 개선은 검색어 필터만 보지 않고 `count: "exact"`와 `liquor_price` 후속 조회 비용까지 함께 평가한다.
- 특히 현재 UI는 최소 글자 수 제한 없이 250ms debounce 뒤 바로 검색을 보내므로, 1자/2자 검색을 별도 hot path로 취급해야 한다.
- 짧은 검색어는 UI에서 막지 않고 유지하되, 서버에서는 `exact count` 없이 `size + 1` 조회로 더 가벼운 페이지네이션 경로를 사용한다.
- 현재 응답 계약과 화면 동작은 유지하고, 정렬 정책 대개편이나 추천/자동완성 추가는 범위에서 제외한다.

## 현재 구조 메모
- 사용자 검색 요청은 `frontend/src/features/catalog/ui/CatalogPageClient.tsx`에서 250ms debounce 후 `/api/liquors/search`를 호출한다.
- 내부 API는 `frontend/app/api/liquors/search/route.ts`에서 `fetchCatalogPageFromServer`로 위임한다.
- 실제 DB 조회는 `frontend/src/features/catalog/api/catalog-server.ts`에서 Supabase `liquor` 테이블에 대해
  `product_name`, `normalized_name`, `brand`에 `or(... ilike ... )` 조건을 걸고,
  `count: "exact"`와 `updated_at desc` 정렬, 페이지 range를 함께 사용한다.
- 현재 페이지 결과를 받은 뒤 `liquor_price`를 `in(liquor_id, ids)`로 다시 조회해 최신 가격을 메모리에서 선택한다.
- 백엔드 JPA `LiquorRepository`, `WhiskyRepository`의 `LIKE` 검색도 남아 있지만 현재 카탈로그 사용자 경로의 직접 병목은 아니다.

## [-] Phase 1. 병목 확인 및 기준선 정리
### 목표
- 지금 어떤 쿼리가 느린지 감으로 처리하지 않고, 실제 병목 후보를 문서로 고정한다.

### 작업
- [x] 현재 사용자 검색 경로가 `frontend`의 Supabase 조회임을 확인한다.
- [x] 검색 대상 컬럼이 `product_name`, `normalized_name`, `brand`임을 확인한다.
- [x] 병목 후보를 3개로 정리한다.
  `ILIKE '%keyword%'` 본문 검색
  `count: "exact"` 전체 개수 계산
  페이지 결과 후 `liquor_price` 재조회 및 최신가 선택
- [ ] 대표 검색어 기준으로 현재 Supabase/Postgres 실행 계획과 응답 시간을 수집한다.
- [ ] 검색어 길이 1자, 2자, 3자 이상에서 계획 차이가 있는지 확인한다.
- [x] 1자/2자 검색 정책을 결정한다.
  현재처럼 허용하되, 서버에서는 `exact count` 없이 `size + 1` 기반 `hasNext` 계산을 사용

### 산출물
- 기준선 쿼리 목록
- 실행 계획 또는 관측 로그 요약
- 병목 우선순위 표
- 짧은 검색어 처리 결정 초안

### 완료 기준
- 어떤 최적화를 먼저 해야 하는지 근거가 문서로 설명 가능해야 한다.

## [ ] Phase 2. `pg_trgm` 적용 전략 확정
### 목표
- 부분 검색 의미론을 유지하면서 인덱스가 실제로 사용될 수 있는 DB 전략을 고정한다.

### 작업
- [ ] `pg_trgm` extension 생성 방식을 정한다.
  문서 메모가 아니라 반복 적용 가능한 DDL 관리 방식으로 확정
- [x] `liquor.product_name`, `liquor.normalized_name`, `liquor.brand`에 대한 trigram GIN 인덱스 초안을 작성한다.
- [x] 벤치마크용 `EXPLAIN ANALYZE` SQL 초안을 작성한다.
- [ ] lower 함수 기반 표현식 인덱스가 필요한지 검토한다.
  현재 쿼리는 `ilike`라서 일반적으로 trigram 인덱스로도 대응 가능하지만, 실제 계획으로 확인 후 결정
- [ ] `updated_at desc` 정렬과 검색 필터를 함께 쓸 때 추가 정렬 비용이 허용 가능한지 확인한다.
- [ ] 1자/2자 검색 전략을 확정한다.
  그대로 허용, 최소 길이 제한, prefix 검색, 제한적 fallback 중 하나를 명시적으로 선택
- [ ] DB 변경물을 저장소에서 반복 적용 가능한 형태로 관리하는 방식을 확정한다.
  예: Supabase SQL migration, 별도 실행 스크립트, 저장소 내 적용용 SQL 파일
- [ ] DDL 적용 순서와 롤백 절차를 정리한다.

### 산출물
- 확정된 SQL 초안
- 인덱스 대상 컬럼별 이유
- 짧은 검색어 대응 정책
- 반복 적용 가능한 DDL 관리 방식
- 적용/롤백 메모

### 완료 기준
- 어떤 DDL을 어느 순서로 넣어야 하는지 바로 실행 가능한 수준으로 정리되어야 한다.
- 동일한 DB 변경을 다른 환경에서도 반복 적용할 수 있어야 한다.

## [-] Phase 3. 조회 쿼리 최적화
### 목표
- DB 인덱스만 추가하고 끝내지 않고, 현재 코드의 불필요한 비용도 함께 줄인다.

### 작업
- [x] `frontend/src/features/catalog/api/catalog-server.ts`의 검색 쿼리를 정리한다.
- [x] `count: "exact"`를 제거하고 `size + 1` 조회 기반으로 바꾼다.
- [x] `hasNext` 계산을 exact count 의존 없이 처리한다.
  `range(from, from + size)`로 한 건 더 조회한 뒤 초과 여부로 판정
- [x] `liquor_price` 후속 조회를 유지할지, 최신 가격 뷰 또는 조인 가능한 읽기 모델로 바꿀지 검토한다.
  `liquor_catalog_latest_price` 뷰 우선 조회 + 뷰 미존재 시 fallback 전략으로 구현
- [x] 검색어 escape 규칙이 Supabase `or(... ilike ...)` 포맷과 충돌하지 않는지 검증한다.
- [x] 짧은 검색어 정책에 맞춰 서버 쿼리 경로를 조정한다.
  UI는 그대로 두고 서버에서 short query mode를 분리

### 산출물
- 수정된 조회 전략
- count 처리 결정
- 가격 조회 구조 결정
- 짧은 검색어별 분기 규칙

### 완료 기준
- 검색 결과 의미론과 페이지네이션 동작을 유지하면서 쿼리 수 또는 쿼리 비용이 줄어야 한다.

## [ ] Phase 4. 검증 및 회귀 방지
### 목표
- 성능 최적화 후 검색 품질이나 화면 흐름이 깨지지 않았는지 고정한다.

### 작업
- [ ] 기존 Playwright 검색 시나리오가 유지되는지 확인한다.
- [ ] Playwright는 UI 상호작용 회귀만 검증한다는 한계를 문서에 명시한다.
- [ ] 대표 검색어에 대해 부분 일치 결과가 기존과 동일한지 비교한다.
- [ ] 검색어 없음 / 검색어 있음 / 결과 없음 / 다음 페이지 로드 시나리오를 다시 확인한다.
- [x] `fetchCatalogPageFromServer` 수준의 테스트 또는 동등한 서버측 검증 경로를 추가한다.
  `catalog-server.test.ts`에서 검색 필터, count 제거, `hasNext`, 최신 가격 선택을 직접 검증
- [ ] 실제 DB 또는 동등한 실행 계획 검증 환경에서 전후 비교를 수행한다.
- [ ] 최적화 전후 실행 계획 또는 응답 시간을 비교해 개선 근거를 남긴다.
- [ ] 문서에 최종 SQL, 적용 결과, 남은 리스크를 기록한다.

### 산출물
- 검증 기록
- 전후 비교 메모
- 서버측 검색 회귀 테스트
- 실 DB 실행 계획 비교 결과
- 최종 진행 문서

### 완료 기준
- 기능 회귀 없이 성능 개선 근거가 남아 있어야 한다.
- UI mock 기반 테스트 밖에서도 서버측 검색 규칙 회귀를 검증할 수 있어야 한다.

## 검증 전략
- 기능 검증은 `frontend`의 `npm run lint`, `npm run build`, 필요 시 `npm run test:e2e`를 기준으로 둔다.
- `frontend/tests/app-flows.spec.ts`는 `/api/liquors/search`를 mock 하므로 DB 쿼리 회귀를 직접 보장하지 못한다.
- 따라서 이번 이슈에서는 서버측 검색 함수 단위 테스트 또는 실 DB 검증을 별도 필수 항목으로 둔다.
- 성능 검증은 Supabase/Postgres에서 실제 실행 계획과 대표 검색어 응답 시간을 비교한다.
- 검색어 길이가 짧을수록 trigram 선택도가 떨어질 수 있으므로, 1자/2자/3자 이상 케이스를 분리해서 본다.

## 구현 결과 메모
- `frontend/src/features/catalog/api/catalog-server.ts`에 검색 계획 생성 로직을 분리했다.
- 1자/2자 검색은 `short` mode, 3자 이상은 `trigram` mode로 분류하지만 현재는 둘 다 같은 부분 문자열 검색 의미론을 유지한다.
- 전체 개수 계산은 제거했고, 페이지네이션은 한 건 더 조회하는 `size + 1` 방식으로 바꿨다.
- `frontend/src/features/catalog/api/__tests__/catalog-server.test.ts`를 추가해 서버측 검색 회귀를 고정했다.
- 현재 기준 [pg_trgm_search_indexes.sql](/home/ubuntu/code/bitO-liquor/docs/references/pg_trgm_search_indexes.sql)에 `pg_trgm` extension, trigram GIN index, `updated_at` 보조 index 초안을 추가했다.
- 현재 기준 [pg_trgm_search_benchmark.sql](/home/ubuntu/code/bitO-liquor/docs/references/pg_trgm_search_benchmark.sql)에 1자/2자/3자 검색과 가격 후속 조회를 비교하는 `EXPLAIN ANALYZE` 샘플을 추가했다.
- `frontend/src/features/catalog/api/catalog-server.ts`는 `liquor_catalog_latest_price` 뷰를 우선 조회하고, 뷰가 없으면 기존 `liquor + liquor_price` 이중 조회로 fallback 하도록 정리했다.
- 현재 기준 [liquor_latest_price_read_model.sql](/home/ubuntu/code/bitO-liquor/docs/references/liquor_latest_price_read_model.sql)에 최신 가격 읽기 모델 뷰와 보조 인덱스 SQL을 추가했다.

## 의존성 및 결정 필요 항목
- 현재 저장소에는 DB migration 체계가 없다.
  이번 이슈에서는 최소한 저장소에서 반복 적용 가능한 DDL 관리물을 남겨야 하며, 문서 메모만으로 끝내지 않는다.
- `liquor_price` 최신가 조회를 뷰로 이동하면 읽기 성능은 좋아질 수 있지만 크롤러 적재 경로와 운영 복잡도가 늘 수 있다.

## 리스크
- `pg_trgm` 인덱스만 추가하고 `exact count`를 유지하면 체감 개선이 제한될 수 있다.
- 검색어가 매우 짧으면 trigram 인덱스 효율이 떨어질 수 있다.
- 짧은 검색어 대응을 명시적으로 정하지 않으면 1자/2자 검색이 계속 hot path로 남는다.
- 인덱스 생성은 데이터 크기에 따라 락/시간 비용이 커질 수 있으므로 운영 반영 순서를 신중히 잡아야 한다.
