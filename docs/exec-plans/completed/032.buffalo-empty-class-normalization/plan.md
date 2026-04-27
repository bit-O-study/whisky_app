# 032.buffalo-empty-class-normalization / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- `normalizeClazz`에서 `None`/공백/빈 문자열을 동일한 empty marker로 통일한다.
- 버팔로트레이스 단건 preview/ingest로 즉시 검증한다.

## 작업 단계
- [x] Phase 1. 현재 값 확인
- [x] Phase 2. 정규화 보강
- [x] Phase 3. 재검증 및 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1`
- `cd backend/crawler-playwright && npm run ingest:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1`

## 리스크
- empty class를 너무 넓게 묶으면 실제로 구분돼야 하는 상품까지 합쳐질 수 있다.
