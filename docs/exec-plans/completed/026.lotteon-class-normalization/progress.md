# 026.lotteon-class-normalization / progress

- 2026-04-24 14:56: Lotteon preview가 `liquor_info`는 맞췄지만 `matchedLiquorId=null`, `liquorAction=insert`로 나와 DB 기존 후보와 `clazz` 표현 차이를 우선 의심하기로 했다.
- 2026-04-24 15:00: Supabase REST로 `brand=조니워커`, `volume_ml=700` 기존 liquor를 조회한 결과 실제 후보는 `블랙루비(id=864)`, `블론드(id=865)`뿐이었고, `블랙 라벨` 계열 liquor row는 아직 없음을 확인했다.
- 2026-04-24 15:02: 그래도 축약형 표현 차이를 흡수하도록 preview `normalizeClazz`에 `블랙 -> 블랙라벨`, `골드 -> 골드라벨` 등 라벨 동의어 매핑을 추가했다.
- 2026-04-24 15:04: preview 결과에 `liquorCandidates[]`와 reason을 추가해, 왜 `reuse`가 아니라 `insert`가 나왔는지 JSON만 보고도 알 수 있게 했다.
- 2026-04-24 15:05: `npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 재실행 결과 `normalizedCandidate.clazz=블랙라벨`로 보정됐지만, 실제 기존 liquor가 없어 여전히 `matchedLiquorId=null`, `liquorAction=insert`가 맞다는 것을 확인했다. 후보 diagnostics에는 `블랙루비`, `블론드`만 노출됐다.
