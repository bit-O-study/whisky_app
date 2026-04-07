# Progress

- 2026-04-01 00:00: `DB 중복 제거 후 벤더별 가격 분리 구조를 화면에 반영`하는 작업을 별도 범위로 관리하기 위해 `008.catalog-deduped-vendor-pricing-sync` 이슈를 생성했다.
- 2026-04-01 00:00: 현재 카탈로그 진입점이 `frontend/app/page.tsx`, `frontend/app/api/liquors/route.ts`, `frontend/app/api/liquors/search/route.ts`, `frontend/src/features/catalog/api/catalog-server.ts`임을 확인했다.
- 2026-04-01 00:00: 현재 프론트는 `Liquor[]` 평면 응답을 받은 뒤 `frontend/src/features/catalog/model/catalog.ts`에서 `name` 기준으로 다시 묶어 판매처 목록과 최저가를 계산하고 있음을 확인했다.
- 2026-04-01 00:00: 현재 구조는 DB에서 중복 상품을 제거하고 벤더별 가격만 분리한 최신 모델과 어긋날 수 있어, 우선 실제 조회 구조와 응답 계약을 다시 확인하는 단계로 정리했다.
- 2026-04-01 00:00: 저장소의 `docs/issues/006.search-performance-pg-trgm/memory/liquor_latest_price_read_model.sql`를 확인한 결과, `liquor_catalog_latest_price` 뷰는 `liquor_id`당 최신 가격 1건만 반환하는 읽기 모델임을 확인했다.
- 2026-04-01 00:00: 이 뷰는 검색 성능에는 유리하지만 멀티벤더 가격 목록을 유지할 수 없으므로, 현재 이슈 기준으로는 카탈로그 기본 조회 모델로 적합하지 않다고 판단했다.
- 2026-04-01 00:00: `frontend/src/features/catalog/api/catalog-server.ts`를 수정해 `liquor`를 기준으로 페이지네이션하고, `liquor_price`에서 같은 `liquor_id`의 가격들을 모아 `source`별 최신가만 남긴 뒤 카드 단위 `vendors[]`와 `lowest_price`를 구성하도록 변경했다.
- 2026-04-01 00:00: `frontend/src/features/catalog/model/catalog.ts`, `frontend/src/features/catalog/api/catalog-client.ts`, `frontend/src/features/catalog/ui/CatalogPageClient.tsx`, `frontend/src/features/catalog/ui/LiquorGrid.tsx`를 수정해 프론트의 `name` 기준 재그룹핑을 제거하고 서버 집계 모델을 직접 소비하도록 정리했다.
- 2026-04-01 00:00: `frontend/src/features/catalog/api/__tests__/catalog-server.test.ts`, `frontend/src/features/catalog/model/__tests__/catalog.test.ts`를 새 구조 기준으로 갱신했고, `npm run lint`, `npm run test`를 통과했다.
