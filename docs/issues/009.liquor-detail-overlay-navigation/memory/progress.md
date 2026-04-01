# Progress

- 2026-04-01 18:00: `카탈로그 오버레이에서 상세 페이지로 이동`하는 작업을 별도 범위로 관리하기 위해 `009.liquor-detail-overlay-navigation` 이슈를 생성했다.
- 2026-04-01 18:00: 현재 `frontend/src/features/catalog/ui/LiquorCard.tsx`는 판매처 외부 링크 오버레이만 제공하고, 내부 상세 라우트는 존재하지 않음을 확인했다.
- 2026-04-01 18:00: 상세 페이지 라우트는 `frontend/app/liquors/[id]/page.tsx` 기준으로 추가하고, 식별자는 우선 `liquor.id`를 사용하기로 정리했다.
- 2026-04-01 18:00: `frontend/src/features/catalog/api/catalog-server.ts`에 단일 주류 상세 조회를 추가해 카탈로그와 동일하게 `liquor` + `liquor_price`를 읽고 `source`별 최신 가격만 남기는 구조로 맞췄다.
- 2026-04-01 18:00: `frontend/app/liquors/[id]/page.tsx`를 추가해 이미지, 상품 메타데이터, 최저가, 판매처별 가격 링크를 보여주는 상세 페이지를 구현했다.
- 2026-04-01 18:00: `frontend/src/features/catalog/ui/LiquorCard.tsx`를 수정해 데스크톱에서는 오버레이 빈 영역 클릭으로 상세 페이지에 이동할 수 있게 했고, 판매처 링크는 기존처럼 외부 페이지로 열리도록 z-index를 분리했다.
- 2026-04-01 18:00: 모바일 카드에는 hover 오버레이가 없으므로 `상세 보기` 버튼을 별도로 추가했다.
- 2026-04-01 18:00: `frontend/src/features/catalog/api/__tests__/catalog-server.test.ts`, `frontend/src/features/catalog/model/__tests__/catalog.test.ts`를 갱신했고, `npm run lint`, `npm run test`, `npm run build`를 모두 통과했다.
- 2026-04-01 18:10: 사용자 피드백에 따라 상세 페이지의 균등 그리드형 정보판 구성을 걷어내고, 이미지 중심 비대칭 레이아웃과 더 큰 타이포 중심의 에디토리얼 상세 화면으로 재조정했다.
- 2026-04-01 18:10: 오버레이의 `오버레이 클릭 시 상세` 문구는 제거했고, 레이아웃 재조정 후 `npm run lint`, `npm run build`를 다시 통과했다.
- 2026-04-01 18:20: 상세 페이지 메타 영역에서 `Code` 항목을 제거했고, 남아 있던 영어 UI 라벨과 fallback 문구를 한글로 정리했다.
