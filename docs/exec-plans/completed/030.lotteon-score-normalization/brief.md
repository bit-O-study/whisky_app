# 030.lotteon-score-normalization / brief

## 배경
- `조니워커 블랙 (700ML)`는 now existing master row `880`를 재사용할 수 있게 됐지만, scoring은 아직 `블랙 라벨` 축약형을 충분히 반영하지 못해 `bestScore=48`로 남아 있다.
- 이 점수 때문에 safety gate가 자동 적재를 계속 차단한다.

## 목표
- scoring 정규화에 `블랙` ↔ `블랙라벨` 같은 축약형 규칙을 추가한다.
- 롯데온 preview/ingest 재실행 시 점수와 safety gate 판단이 개선되는지 확인한다.

## 비목표
- 모든 source 전반의 완전한 scoring 재설계
- Lotteon 정책 전체 제거

## 성공 기준
- `조니워커 블랙 라벨 700ml` Lotteon preview의 `bestScore`가 상승한다.
- safety gate가 `autoWriteAllowed=true` 또는 최소한 `low_score` 사유를 제거한 상태가 된다.
