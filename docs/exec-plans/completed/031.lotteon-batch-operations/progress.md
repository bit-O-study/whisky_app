# 031.lotteon-batch-operations / progress

- 2026-04-24 15:58: Lotteon 중심 운영화를 위해 `liquor_info` 전체 기준 batch preview/ingest 실행기와 summary report를 추가하기로 했다.
- 2026-04-24 16:04: `src/core/liquor-info-keywords.ts`로 `liquor_info` 기반 keyword 생성기를 추가하고, `batch-preview-lotteon.ts`, `batch-ingest-lotteon.ts`, `src/core/batch-report.ts`를 구현했다.
- 2026-04-24 16:07: `npm run preview:lotteon:batch`를 실행해 22개 keyword 기준 preview artifact와 summary를 생성했고, `matched=20`, `autoWriteAllowed=13`, `reviewNeeded=9`를 확인했다.
- 2026-04-24 16:08: `npm run ingest:lotteon:batch`를 실행해 safety gate 통과 13건만 실제 write되고 9건은 차단됨을 확인했다. summary 기준 `wrote=13`, `blocked=9`다.
- 2026-04-24 16:09: batch summary에 따르면 차단 핵심군은 `조니워커 블랙 라벨 12년`, `조니워커 골드 라벨`, `맥캘란 12/15 더블 캐스크`, `발베니 12 더블우드`, `그란츠 트리플 우드`, `와일드 터키 101`, `버팔로 트레이스`, `제임슨`이다.
