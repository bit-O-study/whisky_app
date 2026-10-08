# Brief

## 문제
- 2026-10-08 UI 검수(보고서: https://claude.ai/code/artifact/416550e3-55e8-4d91-8246-0ee60c8592e3)에서 "보이지 않거나 동작하지 않는 UI" 8건(P0)이 확인됐다.

## 목표
- 데스크톱 카드 hover의 할인율 표시, 누락된 `/default.webp` 대체 이미지, 상세 페이지 메타데이터/canonical, 가짜 모바일 하단 내비와 푸터 Legal 텍스트, 태블릿(터치) 판매처 접근, 보조 텍스트·강조색 대비, 키보드 포커스 표시를 고친다.

## 비목표
- P1/P2(히어로 압축, 광고 배너 위치, `@theme` 토큰, 타입 스케일 등)는 후속 작업.

## 성공 기준
- `npm run lint`(신규 경고 없음), `npm run build`, `npm run test` 통과.
- hover 불가 기기에서 카드의 `판매처 보기`가 보이고, hover 가능 기기에서만 오버레이가 뜬다.
- `/liquor/{id}`의 `<title>`·canonical이 상품별로 다르다.

## 관련 문서
- `docs/product-specs/catalog-browse-and-search.md`
- `docs/DESIGN.md`, `docs/FRONTEND.md`
