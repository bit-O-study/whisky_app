# 030.lotteon-score-normalization / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- source scoring 함수의 `normalizeForMatch`에 축약형/라벨 동의어 확장을 추가한다.
- master row 재사용이 이미 가능한 상태이므로, 이번에는 score와 safety gate 결과 변화에 집중한다.

## 작업 단계
- [x] Phase 1. scoring 불일치 확인
- [x] Phase 2. 정규화 보강
- [x] Phase 3. preview/ingest 재검증 및 문서화

## 검증
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `cd backend/crawler-playwright && npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`

## 리스크
- 특정 별칭에 대한 점수 보정이 다른 유사 상품까지 과대 매칭할 수 있다.
