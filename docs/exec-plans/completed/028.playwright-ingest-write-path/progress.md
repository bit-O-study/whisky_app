# 028.playwright-ingest-write-path / progress

- 2026-04-24 15:31: preview/safety gate 위에 실제 upsert 경로를 올리되, safety gate를 통과한 건만 write하도록 범위를 고정했다.
- 2026-04-24 15:37: `src/core/ingest-write.ts`, `ingest:emart`, `ingest:lotteon` CLI를 추가하고 `liquor`/`liquor_price`/`liquor_url` REST upsert 경로를 구현했다.
- 2026-04-24 15:40: `npm run ingest:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1` 실행 결과 safety gate 통과 후 기존 liquor `871`를 재사용하고 price `882`, url `17` 업데이트를 확인했다. artifact는 `artifacts/writes/emart-ingest-2026-04-24T05-20-04-552Z.json`에 저장됐다.
- 2026-04-24 15:41: `npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 실행 결과 safety gate에 의해 `blocked=true`, `blockReason=low_score:48`로 차단되었고 DB write는 수행되지 않았다. artifact는 `artifacts/writes/lotteon-ingest-2026-04-24T05-20-18-205Z.json`에 저장됐다.
