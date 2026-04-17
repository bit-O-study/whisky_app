# Tech Debt Tracker

## Open

### 실제 DB 기준 검색 벤치마크 미수집
- 배경
  `pg_trgm` 전략은 정리됐지만 실제 DB의 `EXPLAIN ANALYZE` 수집이 아직 없다.
- 참고
  [search-performance-pg-trgm.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/search-performance-pg-trgm.md)

### DB 스키마 자동 생성 부재
- 배경
  `docs/generated/db-schema.md`가 아직 수동 스냅샷이다.
- 목표
  실제 스키마 export 기반 자동 생성으로 전환

### 문서 참조 무결성 자동 점검 부재
- 배경
  문서 구조를 artifact 중심으로 재편했지만 링크 검증 자동화가 없다.
- 목표
  주요 문서 링크와 실행 계획 폴더 규칙을 확인하는 문서 lint 추가
