# 030.lotteon-score-normalization / progress

- 2026-04-24 15:48: 마스터 row 추가 후에도 score가 48로 남아 safety gate가 차단되는 것을 확인하고, scoring 정규화가 축약형 표현을 충분히 반영하지 못하는 문제를 이번 단계에서 보정하기로 했다.
- 2026-04-24 15:50: `src/sources/lotteon.ts`의 `normalizeForMatch`에 `블랙라벨 -> 블랙`, `골드라벨 -> 골드` 등 라벨 축약형 정규화를 추가했다.
- 2026-04-24 15:52: Lotteon preview 재실행 결과 `bestScore=148`, `matchedLiquorId=880`, `confidence=high`, `autoWriteAllowed=true`로 개선된 것을 확인했다.
- 2026-04-24 15:53: Lotteon ingest 재실행 결과 safety gate 통과 후 liquor `880`을 재사용하고 price `883`, url `18` insert가 수행됐다.
