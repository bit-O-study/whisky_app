# Progress

- 2026-04-16 15:30: 사용자 요청에 따라 최근 추가한 주류 상세 페이지 작업 제거를 진행하기로 했다.
- 2026-04-16 15:30: `frontend/app/liquors/[id]/page.tsx`, `LiquorCard`, `catalog-server`, 관련 spec/doc references가 제거 후보임을 확인했다.
- 2026-04-16 15:30: 상세 진입 이전 카드 동작은 `d1a686c` 시점의 판매처 외부 링크 중심 오버레이였음을 확인했다.
- 2026-04-16 15:40: `frontend/app/liquors/[id]/page.tsx`를 제거하고, `LiquorCard`를 상세 진입 이전 상태의 판매처 외부 링크 오버레이로 되돌렸다.
- 2026-04-16 15:40: `catalog-server`, `catalog` 모델, 관련 unit test에서 상세 조회 전용 타입/함수/테스트를 제거했다.
- 2026-04-16 15:40: 제품/설계/아키텍처 문서에서 상세 페이지를 현재 계약으로 보던 서술을 카탈로그 중심 상태로 정리했다.
- 2026-04-16 15:45: Playwright API mock이 현재 `CatalogPage` 계약과 맞지 않아 E2E가 실패하는 것을 확인하고, `frontend/tests/app-flows.spec.ts` fixture를 `vendors[]` 기반 카드 모델로 갱신했다.
- 2026-04-16 15:46: `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` 검증을 모두 통과했다.
