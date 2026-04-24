# 029.insert-black-label-master / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 먼저 `liquor_info`와 기존 `liquor` row 패턴을 확인해 필요한 필드값을 정한다.
- 수동 insert는 source-specific URL 없이 canonical master row로 넣는다.
- insert 후 Lotteon preview/ingest를 재실행해 reuse 경로와 safety gate 상태를 점검한다.

## 작업 단계
- [x] Phase 1. 기존 패턴 확인
- [x] Phase 2. master row insert
- [x] Phase 3. preview/ingest 재검증 및 문서 정리

## 검증
- Supabase REST 조회로 insert 전후 row 확인
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `cd backend/crawler-playwright && npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`

## 리스크
- 현재는 master 부재 문제만 해소됐고, Lotteon 저점수 정책 때문에 자동 write는 여전히 차단된다.
