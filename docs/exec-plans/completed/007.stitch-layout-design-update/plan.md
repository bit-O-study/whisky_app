# Implementation Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 방향
- 이번 이슈는 현재 메인 카탈로그 화면에 Stitch 기반 새 레이아웃을 입히는 프론트엔드 디자인 업데이트에 한정한다.
- 데이터 로딩 흐름은 유지하고, 주 수정 지점은 `frontend/app/page.tsx`에서 렌더링하는 `CatalogPageClient`와 그 하위 UI 컴포넌트로 잡는다.
- Stitch 산출물은 그대로 복사하기보다 기존 코드 구조와 상태 흐름에 맞게 정리해 반영한다.
- 반응형 레이아웃, 검색 입력 UX, 목록 가독성을 함께 확인한다.

## [x] Phase 1. 이슈 생성 및 범위 고정
### 목표
- Stitch 레이아웃 업데이트를 별도 이슈로 생성하고 적용 범위를 문서로 고정한다.

### 작업
- [x] `007.stitch-layout-design-update` 이슈 디렉터리를 생성한다.
- [x] 이번 작업 범위를 메인 카탈로그 디자인 업데이트로 한정한다.
- [x] 현재 주요 진입점이 `frontend/app/page.tsx`, `frontend/src/features/catalog/ui/CatalogPageClient.tsx`임을 확인한다.

### 완료 기준
- 변경 범위와 비범위가 `brief.md`에 정리되어 있어야 한다.

## [x] Phase 2. Stitch 레이아웃 적용 설계
### 목표
- 어떤 화면 블록을 유지하고 어떤 UI 구조를 바꿀지 구현 단위를 정리한다.

### 작업
- [x] Stitch 시안의 핵심 레이아웃 블록과 현재 화면 구조를 매핑한다.
- [x] 유지할 상호작용과 변경할 시각 요소를 구분한다.
- [x] 필요 시 `CatalogPageClient`, `LiquorGrid`, 공통 스타일의 책임을 다시 정리한다.
- [x] 정적 자산, 타이포그래피, 배경/섹션 구조 반영 방식을 결정한다.

### 완료 기준
- 구현 전에 수정 대상 컴포넌트와 시각 변경 범위가 명확해야 한다.

## 현재 산출물 해석 메모
- Stitch 전달물은 현재 기준 [atmospheric-sommelier.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/atmospheric-sommelier.md)의 디자인 원칙 문서와 [stitch-layout-prototype.html](/home/ubuntu/code/bitO-liquor/docs/references/stitch-layout-prototype.html)의 정적 HTML 프로토타입으로 구성되어 있다.
- `stitch-layout-prototype.html`에는 상단 glass header, 우측 검색창, 지표 영역, 4열 상품 월, 푸터, 모바일 하단 내비게이션 구조가 들어 있다.
- 다만 해당 HTML은 `cdn.tailwindcss.com`, Google Fonts, Material Symbols, 외부 이미지 URL, 하드코딩된 샘플 문구와 샘플 가격 데이터를 포함하므로 그대로 복사해 제품 코드로 넣지 않는다.
- 실제 구현은 현재 `CatalogPageClient` 상태 흐름과 `LiquorGrid`/`LiquorCard` 데이터 계약을 유지한 채, 레이아웃과 토큰만 선택적으로 이식하는 방식으로 진행한다.

## 구현 결과 메모
- `frontend/app/globals.css`에 warm ivory 배경, tonal layer, glass header, editorial 타이포그래피 스택, 공통 chip/panel 토큰을 추가했다.
- 초기 구현은 [atmospheric-sommelier.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/atmospheric-sommelier.md) 분위기를 과하게 해석해 hero 중심 레이아웃으로 갔고, 사용자 피드백 후 실제 기준을 `stitch-layout-prototype.html` 구조로 다시 고정했다.
- `frontend/src/features/catalog/ui/CatalogPageClient.tsx`는 최종적으로 Stitch `stitch-layout-prototype.html`에 가깝게 상단 wordmark bar, 우측 검색창, 결과 요약 줄, 4열 카드 월, footer, 모바일 하단 bar 구조로 재구성했고, 사용자 피드백에 따라 상단 보조 메트릭 섹터는 제거했다.
- `frontend/src/features/catalog/ui/LiquorGrid.tsx`의 로딩/에러/빈 상태 UI를 새 톤으로 정리했고, 카드 월 간격과 열 구성을 `stitch-layout-prototype.html`에 더 가깝게 맞췄다.
- `frontend/src/features/catalog/ui/LiquorCard.tsx`는 카드 비율, square 이미지 영역, 상단 signal tag, 하단 price/vendors row를 `stitch-layout-prototype.html`에 맞게 다시 정렬했다.
- 이후 사용자 피드백에 맞춰 데스크톱에서는 판매처/가격 비교가 카드 hover와 focus-within 시 하단 오버레이 레이어로 겹쳐 보이도록 복원했고, 모바일만 `details` 패널로 유지했다.
- `frontend/src/features/catalog/api/catalog-server.ts`의 `mapLiquorRow` 타입을 실제 사용 필드 기준으로 완화해, 기존 latest price view 경로의 타입 오류로 막히던 프론트 빌드를 통과시켰다.

## [x] Phase 3. 프론트엔드 디자인 구현
### 목표
- Stitch 기준의 새 레이아웃을 실제 화면에 반영한다.

### 작업
- [x] 메인 카탈로그 상단 구조와 검색 영역 레이아웃을 새 시안에 맞게 갱신한다.
- [x] 목록 영역, 상태 표시, 여백 체계를 새 레이아웃 기준으로 정리한다.
- [x] 필요 시 컴포넌트 분리 또는 스타일 정리를 수행한다.
- [x] 기존 검색/무한 스크롤/재시도 동작이 유지되도록 연결한다.

### 완료 기준
- 새 레이아웃이 적용되고 핵심 동작 회귀가 없어야 한다.

## [x] Phase 4. 검증 및 문서 마감
### 목표
- 디자인 업데이트가 기본 검증 기준을 만족하는지 확인하고 문서에 남긴다.

### 작업
- [x] `progress.md`에 구현 및 판단 변경 내역을 기록한다.
- [x] `frontend`에서 `npm run lint`를 실행한다.
- [x] `frontend`에서 `npm run build`를 실행한다.
- [x] 필요 시 시각 회귀 확인 결과를 문서에 남긴다.

### 완료 기준
- 검증 결과와 남은 리스크가 문서에 기록되어 있어야 한다.
