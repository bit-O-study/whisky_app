# 026.lotteon-class-normalization / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 먼저 Supabase에서 동일 브랜드/용량 후보의 `class` 값을 확인한다.
- preview 전용 `clazz` 정규화 레이어에 동의어/축약형 매핑을 추가한다.
- 롯데온 preview를 재실행해 `insert` → `reuse` 전환 여부를 본다.

## 작업 단계
- [x] Phase 1. DB 후보 조사
- [x] Phase 2. 정규화 보강
- [x] Phase 3. 재검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- Supabase REST 조회로 `brand=조니워커`, `volume_ml=700` liquor 후보 확인

## 리스크
- 실제 DB에 해당 마스터가 정말 없으면 정규화만으로는 `reuse`로 바뀌지 않는다.
