# 028.playwright-ingest-write-path / brief

## 배경
- `backend/crawler-playwright`는 crawl + ingest preview + safety gate까지는 갖췄지만, 실제 DB write 경로는 아직 붙지 않았다.
- 사용자는 이제 upsert를 진행하길 원한다. 다만 현재 정책상 위험 건은 자동 적재하지 말고 safety gate를 먼저 통과해야 한다.

## 목표
- Playwright 수집 결과를 Supabase REST로 실제 upsert하는 write path를 추가한다.
- `liquor`, `liquor_price`, `liquor_url`를 현재 Java crawler 규칙과 최대한 동일하게 처리한다.
- safety gate를 통과한 건만 write하고, 차단된 건은 block 결과만 남긴다.

## 비목표
- Selenium 제거
- Java crawler 완전 대체
- 모든 source에 대한 무제한 자동 적재 허용

## 성공 기준
- `npm run ingest:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`가 실제 upsert를 수행하고 결과 JSON을 남긴다.
- `npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`는 safety gate에 의해 write가 차단되고 차단 이유를 남긴다.
