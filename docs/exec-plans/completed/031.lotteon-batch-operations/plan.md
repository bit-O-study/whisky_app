# 031.lotteon-batch-operations / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- `liquor_info`를 직접 조회해 batch keyword를 생성한다.
- Lotteon preview/ingest 결과를 summary JSON/Markdown으로 요약해 운영자가 한눈에 볼 수 있게 한다.
- safety gate를 그대로 존중해 write 허용 건만 실제 upsert한다.

## 작업 단계
- [x] Phase 1. batch keyword/source 설계
- [x] Phase 2. batch preview/ingest 구현
- [x] Phase 3. 실행 검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run preview:lotteon:batch`
- `cd backend/crawler-playwright && npm run ingest:lotteon:batch`
- `bash scripts/verify-repo.sh`

## 리스크
- batch ingest는 실데이터를 한 번에 갱신하므로 source 품질 이슈가 있으면 영향 범위가 커질 수 있다.
