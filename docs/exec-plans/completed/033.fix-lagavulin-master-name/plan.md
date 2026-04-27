# 033.fix-lagavulin-master-name / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 현재 라가불린 master row를 직접 조회해 대상 id와 현 값을 확인한다.
- Supabase REST patch로 `product_name`만 canonical 값으로 수정한다.
- 변경 후 동일 row를 다시 조회해 값 반영 여부를 검증한다.

## 작업 단계
- [x] Phase 1. 대상 row 확인
- [x] Phase 2. product_name patch
- [x] Phase 3. 검증 및 기록

## 검증
- Supabase REST로 row 변경 전/후 조회
- Lotteon preview 재조회로 existing candidate 노출 값 확인

## 리스크
- 수동 DB 수정이므로 다른 contaminated master 이름은 그대로 남아 있다.
