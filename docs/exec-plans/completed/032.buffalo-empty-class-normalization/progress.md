# 032.buffalo-empty-class-normalization / progress

- 2026-04-24 16:14: 버팔로트레이스는 점수나 후보 부족 문제가 아니라 `clazz=None` vs 기존 DB 빈 문자열 class 차이 때문에 새 insert 후보로 오인되는 문제를 해결하기로 했다.
- 2026-04-24 16:17: `normalizeClazz`에서 `None`, 빈 문자열, 공백을 모두 같은 empty class(`""`)로 정규화하도록 보강했다.
- 2026-04-24 16:19: `npm run preview:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1` 재실행 결과 `matchedLiquorId=875`, `liquorAction=reuse`, `autoWriteAllowed=true`로 정상화됐다.
- 2026-04-24 16:20: `npm run ingest:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1` 재실행 결과 liquor `875`를 재사용하고 price `876`, url `12`를 업데이트했다.
