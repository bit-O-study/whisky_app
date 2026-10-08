# Plan

## 접근 방향
- 파일 단위 최소 수정. 공용 상수는 `src/shared/config/default-images.ts`.
- hover/터치 분기는 `md` 폭이 아니라 `@media (hover:hover) and (pointer:fine)`.
- 대비: `--catalog-soft` #9c9388 → #7a7166(4.6:1), 작은 강조 글씨용 `--catalog-primary-text` #b8430f(5.5:1) 신설, `.catalog-kicker`에 적용.
- 포커스: 전역 `:focus-visible` 2px outline.
- 상세 메타: `generateMetadata` + `react.cache`로 상세 조회 1회 공유.

## 작업 단계
- [x] Phase 1. 검수 및 전/후 스크린샷
- [x] Phase 2. 구현
- [x] Phase 3. 검증

## 검증
- lint(기존 경고 1건만), build, vitest 22/22 통과. 빌드 CSS에서 hover 미디어 규칙 생성 확인.

## 리스크
- 로컬에 Supabase 자격 증명이 없어 실데이터 렌더 확인은 배포 후 재캡처로 대체.
- `tests/app-flows.spec.ts`의 기존 tsc 오류(TS18048)는 이번 범위 밖.
