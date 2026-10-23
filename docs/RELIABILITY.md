# RELIABILITY

## 현재 관심사
- 부분 일치 검색 성능
- 첫 페이지 서버 선조회 안정성
- 판매처 가격 집계의 일관성
- 빌드/테스트 환경 차이로 인한 검증 편차

## 현재 대응
- 롯데온 수집: 가격이 없는 항목은 기존 값을 보존한다. 정상 저장은 확인 시각과 가격 이력을 함께 갱신한다. 실패/0건을 정상 완료로 응답하지 않는다.
- 일일 Java 배치는 GitHub Actions에서 실행하며 병렬 중복 실행을 막는다. 실행 로그와 테스트 결과를 보관한다. 첫 수동 실행 확인 전에는 배포 완료로 판단하지 않는다.
- 검색 성능은 `pg_trgm` 중심으로 개선 방향을 관리한다.
- 카탈로그는 판매처 가격 집계 원칙을 일관되게 사용한다.
- 기본 검증은 lint/build/test/e2e 순으로 유지한다.

## 남은 리스크
- 실제 DB에서의 검색 실행 계획 수집이 미완료다.
- `docs/generated/db-schema.md`를 자동 생성으로 대체하는 작업이 남아 있다.

## 추적 위치
- [search-performance-pg-trgm.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/search-performance-pg-trgm.md)
- [tech-debt-tracker.md](/home/ubuntu/code/bitO-liquor/docs/exec-plans/tech-debt-tracker.md)
