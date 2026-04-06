# Progress

- 2026-03-25 11:00: `005.header-logo-scroll-top` 이슈를 생성하고, 메인 헤더 브랜드 영역에 이미지 추가와 최상단 복귀 인터랙션만 이번 범위로 한정했다.
- 2026-03-25 11:01: 현재 헤더 구현이 `frontend/src/features/catalog/ui/CatalogPageClient.tsx`에 있으며, 기존 `Jururuk` 버튼은 이모지 기반 아이콘과 검색 초기화 동작을 함께 가지고 있음을 확인했다.
- 2026-03-25 11:02: 이번 변경에서는 정적 로고 자산을 추가하고, 브랜드 버튼 클릭 시 검색어 초기화 없이 최상단 스무스 스크롤만 수행하도록 정리하기로 결정했다.
- 2026-03-25 11:04: `frontend/public/jururuk-mark.svg`를 추가하고, `CatalogPageClient.tsx` 헤더 브랜드 영역을 이미지 + 텍스트 조합으로 교체했다.
- 2026-03-25 11:04: 로고 클릭 동작은 검색 상태를 유지한 채 `window.scrollTo({ top: 0, behavior: "smooth" })`만 수행하도록 수정했다.
- 2026-03-25 11:05: `frontend`에서 `npm run lint`를 실행해 통과했고, 이번 이슈는 문서와 구현 기준으로 마감 가능한 상태다.
