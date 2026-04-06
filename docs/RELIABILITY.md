# RELIABILITY

## 현재 관심사
- 부분 일치 검색 성능
- 첫 페이지 서버 선조회 안정성
- 판매처 가격 집계의 일관성
- 빌드/테스트 환경 차이로 인한 검증 편차

## 현재 대응
- 검색 성능은 `pg_trgm` 중심으로 개선 방향을 관리한다.
- 카탈로그와 상세 페이지는 같은 가격 집계 원칙을 따른다.
- 기본 검증은 lint/build/test/e2e 순으로 유지한다.

## 남은 리스크
- 실제 DB에서의 검색 실행 계획 수집이 미완료다.
- `docs/generated/db-schema.md`를 자동 생성으로 대체하는 작업이 남아 있다.

## 추적 위치
- [search-performance-pg-trgm.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/search-performance-pg-trgm.md)
- [tech-debt-tracker.md](/home/ubuntu/code/bitO-liquor/docs/exec-plans/tech-debt-tracker.md)
