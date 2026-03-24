# HANDOFF

## Goal
- `001.nextjs-supabase-migration` 이후 발생한 홈 카탈로그 UI 회귀를 복구한다.
- Next.js App Router + 내부 API route + Supabase 조회 구조는 유지한다.
- 기존 Vite 시절 `frontend/src/App.tsx`의 카탈로그 인상을 가능한 한 가깝게 되돌린다.

## Current State
- 카탈로그 상단 구조, 검색창 배치, 소개 히어로, 검색/기본 상태 요약 패널을 다시 구성했다.
- 카드/그리드/전역 배경 스타일을 복구했고, Tailwind 유틸리티가 실제로 적용되도록 PostCSS 설정을 추가했다.
- 현재 기준 검증은 모두 통과했다.
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`
- 로컬 개발 서버에서 `http://localhost:3000` 기준으로 화면을 다시 확인했고, 전환 직후처럼 레이아웃이 무너지는 상태는 아니다.

## What I Tried
- 이슈 문서부터 읽고 `4a45afa`의 `frontend/src/App.tsx`를 복구 기준으로 잡았다.
- `fb0a541` 전환 커밋을 확인해 왜 UI가 달라졌는지 추적했다.
- `CatalogPageClient.tsx`, `LiquorGrid.tsx`, `LiquorCard.tsx`, `app/globals.css`를 수정해 예전 카탈로그 흐름에 가깝게 복구했다.
- 로컬 화면을 띄워보는 과정에서 Tailwind 유틸리티가 번들에 포함되지 않는 문제를 발견했다.
- `frontend/postcss.config.mjs`를 추가하고 `@tailwindcss/postcss`, `postcss`를 dev dependency로 넣어 Tailwind 유틸리티 생성 문제를 복구했다.

## What Worked
- 전환 직후의 단순한 `CatalogPageClient` 구조를 헤더 + 히어로 + 상태 요약 + 그리드 흐름으로 복구했다.
- 카드에 판매처 수, 최저가 강조, 메타 정보, hover 가격 오버레이를 다시 강화했다.
- Tailwind 유틸리티 누락 문제는 PostCSS 설정 추가로 해결됐다.
- 검증 명령은 모두 통과했다.

## What Did Not Work
- 처음에는 UI 코드 문제로 보였지만 실제 원인은 Tailwind 유틸리티 CSS가 생성되지 않는 설정 누락이었다.
- Playwright 캡처 환경에서는 한글이 네모로 보였는데, 이는 렌더링 구조 문제가 아니라 캡처 환경 폰트 문제로 보인다.
- Supabase 환경변수 없이 로컬 개발 서버를 띄우면 `/api/liquors` 호출은 500이 난다. UI 구조는 볼 수 있지만 실데이터 카드는 비어 있을 수 있다.

## Why The UI Changed In Migration
- 전환 작업이 "그대로 옮기기"가 아니라 "Next.js 전환 + 카탈로그 재구성"으로 진행됐기 때문이다.
- 근거:
  - 전환 커밋: `fb0a541 feat: frontend nextjs 전환 및 카탈로그 재구성`
  - 같은 커밋에서 `frontend/src/App.tsx` 삭제
  - 같은 커밋에서 `PreferenceTest`, `FeaturedPick`, `TestLoadingPage`, `TestResultPage`, `preferenceApi` 삭제
  - 새 `CatalogPageClient.tsx`는 목록/검색/무한스크롤만 남긴 얇은 카탈로그 구조였음
- 즉 기술 계층 전환과 동시에 UI를 단순화/축소하는 판단이 함께 들어갔다. 그래서 기능은 남았지만 기존 카탈로그 인상은 깨졌다.

## Open Questions or Risks
- 실제 Supabase env를 붙인 상태에서 카드 이미지/카피/간격 인상이 기대 수준인지 한 번 더 봐야 한다.
- 현재 Playwright는 API를 mock해서 통과하므로, 실데이터 기준 최종 인상 검증과는 별개다.
- 로컬 캡처 환경의 한글 폰트 문제는 브라우저 직접 확인과 구분해서 봐야 한다.

## Next Steps
1. `frontend`에서 필요한 Supabase env를 넣고 `npm run dev`로 실데이터 화면을 확인한다.
2. 카드 밀도, 섹션 여백, 모바일 인상을 실브라우저에서 다시 본다.
3. 필요하면 이번 복구 범위 안에서 카피/spacing만 미세 조정한다.

## Relevant Files
- `docs/issues/002.nextjs-ui-regression-recovery/prd.md`
- `docs/issues/002.nextjs-ui-regression-recovery/memory/implementation-plan.md`
- `docs/issues/002.nextjs-ui-regression-recovery/memory/progress.md`
- `docs/issues/002.nextjs-ui-regression-recovery/HANDOFF.md`
- `frontend/src/components/CatalogPageClient.tsx`
- `frontend/src/components/LiquorGrid.tsx`
- `frontend/src/components/LiquorCard.tsx`
- `frontend/app/globals.css`
- `frontend/postcss.config.mjs`
- `frontend/package.json`
