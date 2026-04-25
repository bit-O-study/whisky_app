# 027.preview-safety-gates / progress

- 2026-04-24 15:12: preview 결과만으로 자동 적재 여부를 판단하기 어려워 `confidence`, `reviewNeeded`, `blockReason` 레이어를 추가하기로 했다.
- 2026-04-24 15:16: `src/core/safety-gates.ts`를 추가해 `low_score`, `conflicting_existing_candidates`, `lotteon_new_insert_requires_review` 규칙을 안전장치 1차 정책으로 고정했다.
- 2026-04-24 15:19: preview CLI가 `safetyGate`를 함께 출력하도록 연결했다.
- 2026-04-24 15:22: Emart preview 재실행 결과 `confidence=high`, `reviewNeeded=false`, `autoWriteAllowed=true`로 나와 자동 적재 허용 기준에 들어감을 확인했다.
- 2026-04-24 15:24: Lotteon preview 재실행 결과 `confidence=low`, `reviewNeeded=true`, `autoWriteAllowed=false`, reasons=`low_score:48`, `conflicting_existing_candidates`, `lotteon_new_insert_requires_review`로 차단됨을 확인했다.
