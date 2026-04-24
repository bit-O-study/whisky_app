# 028.playwright-ingest-write-path / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- preview와 같은 Supabase REST 환경 로딩을 재사용한다.
- write 전에는 항상 preview + safety gate를 수행한다.
- write 허용 건만 `liquor` 재사용/생성 후 `liquor_price`, `liquor_url` upsert를 실행한다.

## 작업 단계
- [x] Phase 1. write 규칙과 범위 확정
- [x] Phase 2. 구현
- [x] Phase 3. 실제 실행 검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run build`
- `cd backend/crawler-playwright && npm run ingest:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`
- `cd backend/crawler-playwright && npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `bash scripts/verify-repo.sh`

## 리스크
- REST 기반 upsert는 DB 제약과 스키마 드리프트 영향을 직접 받는다.
- write가 실제 데이터에 반영되므로 sample 실행도 운영 데이터 변경을 유발한다.
