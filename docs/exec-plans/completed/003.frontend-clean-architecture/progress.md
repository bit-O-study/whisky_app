# Progress

- 2026-03-25 00:00: 프론트 클린 아키텍처 전환 논의를 별도 이슈 `003.frontend-clean-architecture`로 분리했다.
- 2026-03-25 00:00: 이번 이슈의 방향을 "전면 재작성"이 아니라 "카탈로그 기능부터 시작하는 점진적 구조 전환"으로 확정했다.
- 2026-03-25 00:00: `prd.md`를 작성해 문제, 목표, 비목표, 성공 기준, 범위를 정리했다.
- 2026-03-25 00:00: `memory/implementation-plan.md`를 작성해 현재 책임 분해, entity/mapper 분리, repository/usecase 도입, UI 계층 정리, 검증 단계로 구현 계획을 정리했다.
- 2026-03-25 00:00: 현재 시점에서 구현은 아직 시작하지 않았고, 다음 작업의 첫 단계는 카탈로그 관련 기존 파일들의 책임을 분해해 새 구조 경계를 확정하는 것이다.
- 2026-03-25 10:20: 현재 카탈로그 책임을 분해했고, 이번 이슈의 기준 구조를 `entities/liquor`, `features/catalog`, `shared` 조합으로 확정했다.
- 2026-03-25 10:20: `CatalogPageClient`에 몰려 있는 검색 debounce, 페이지 append/replace, 초기 요청 skip, 에러 메시지 분기를 `features/catalog/model`의 테스트 가능한 규칙으로 옮기기로 정리했다.
- 2026-03-25 10:20: 단위 테스트는 `Vitest`, 회귀 검증은 기존 `Playwright`를 유지하는 방향으로 확정했다.
- 2026-03-25 10:35: `Liquor` 도메인 모델을 `entities/liquor/model`로 이동했고, 내부 API 응답 DTO 및 mapper를 `entities/liquor/api`로 분리했다.
- 2026-03-25 10:35: 카탈로그 조회 규칙을 `features/catalog/model/catalog.ts`로 이동해 초기 요청 skip, 페이지 merge, 에러 메시지, 그룹핑 로직을 단위 테스트로 고정했다.
- 2026-03-25 10:35: 클라이언트 fetcher와 서버 Supabase 조회를 각각 `features/catalog/api/catalog-client.ts`, `features/catalog/api/catalog-server.ts`로 이동했다.
- 2026-03-25 10:35: `CatalogPageClient`, `LiquorGrid`, `LiquorCard`를 `features/catalog/ui`로 이동해 UI가 entity/feature model만 의존하도록 정리했다.
- 2026-03-25 10:35: `Vitest`를 추가하고 `vitest.config.ts`로 Playwright E2E와 단위 테스트 실행 범위를 분리했다.
- 2026-03-25 10:35: 검증 결과 `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`를 모두 통과했다. `npm run build`는 샌드박스 제한으로 한 번 실패했고, 권한 상승 후 정상 통과했다.
