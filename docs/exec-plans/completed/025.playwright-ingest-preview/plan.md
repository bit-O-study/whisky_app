# 025.playwright-ingest-preview / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 새 의존성 추가 없이 Node 내장 `fetch`로 Supabase REST를 조회해 preview를 계산한다.
- 매칭 규칙은 현재 Java crawler service의 `findLiquorInfo`, `upsertLiquor`, `upsertLiquorPrice`, `upsertLiquorUrl` 동작을 최대한 따르는 방향으로 구현한다.
- 실제 write 대신 preview artifact만 남긴다.

## 작업 단계
- [x] Phase 1. preview 규칙 조사와 범위 확정
- [x] Phase 2. preview 코어/CLI 구현
- [x] Phase 3. 문서 반영과 검증

## 검증
- `cd backend/crawler-playwright && npm run build`
- `cd backend/crawler-playwright && npm run preview:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `bash scripts/verify-repo.sh`

## 리스크
- Supabase REST 조회에 필요한 서버 전용 환경변수가 없으면 preview가 실행되지 않는다.
- Java write path와 preview 구현이 조금씩 드리프트할 수 있다.
