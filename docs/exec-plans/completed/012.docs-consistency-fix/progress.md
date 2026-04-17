# Progress

- 2026-04-06 00:00: 문서 리뷰 결과 상위 가이드의 프론트 실행 설명, 서비스 키 요구사항, `liquor_catalog_latest_price` 뷰 역할, `shared/` 구조 설명이 현재 코드와 완전히 맞지 않음을 확인했다.
- 2026-04-06 00:00: 이번 작업 범위를 "현재 소스 오브 트루스 문서 정정"으로 한정하고, 아카이브 역사 기록 전체 재작성은 제외하기로 했다.
- 2026-04-06 00:00: `AGENTS.md`, `README.md`, `docs/SECURITY.md`를 현재 프론트 스크립트와 서버 전용 Supabase 키 요구사항 기준으로 정정했다.
- 2026-04-06 00:00: `docs/FRONTEND.md`, `docs/design-docs/frontend-clean-architecture.md`에서 `shared/`를 목표 경계로, `lib/`를 전환 중 공용 모듈 위치로 명시해 현재 상태와 목표 상태를 분리했다.
- 2026-04-06 00:00: `docs/design-docs/supabase-data-model.md`, `docs/design-docs/search-performance-pg-trgm.md`, `docs/generated/db-schema.md`를 수정해 `liquor_catalog_latest_price`가 현재 멀티벤더 카탈로그 기본 계약을 대체하지 않는다는 점을 명확히 했다.
- 2026-04-06 00:00: `rg`, 링크 존재 확인, `git diff --check` 기준으로 문서 정합성을 다시 확인했고, 이번 작업은 마감 가능한 상태다.
