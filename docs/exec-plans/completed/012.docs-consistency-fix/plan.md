# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 역사 기록을 광범위하게 다시 쓰기보다, 현재 소스 오브 트루스 역할을 하는 문서부터 현재 코드 기준으로 정렬한다.
- 카탈로그 가격 계약은 `vendors[]` 중심으로 고정하고, `liquor_catalog_latest_price` 뷰는 선택적/특수 목적 read model로만 설명한다.

## 작업 단계
- [x] Phase 1. 충돌 지점 재확인
- [x] Phase 2. 상위 운영 문서 정정
- [x] Phase 3. 설계 문서 정정
- [x] Phase 4. 검증과 기록 정리

## 검증
- `rg -n "Vite 개발 서버|tsc -b|NEXT_PUBLIC_SUPABASE_ANON_KEY|liquor_catalog_latest_price|shared/" AGENTS.md README.md docs frontend/README.md -S`
- `git diff --check -- AGENTS.md README.md docs`
- 링크 경로가 존재하는지 간단 점검

## 리스크
- 아카이브 문서는 과거 시점 서술이므로 일부 표현 차이가 의도적으로 남을 수 있다.
- `shared/` 목표 구조와 현재 `lib/` 공존 상태를 너무 단정적으로 쓰면 다시 오해를 낳을 수 있다.
