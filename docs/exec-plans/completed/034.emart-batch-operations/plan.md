# 034.emart-batch-operations / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 기존 Lotteon batch CLI 구조를 Emart source에 맞게 복제한다.
- Emart는 검색 결과 fallback 위험이 있으므로 신규 master insert를 자동 허용하지 않는다.
- 기존 summary writer를 재사용한다.

## 작업 단계
- [x] Phase 1. Emart batch CLI 추가
- [x] Phase 2. Emart safety gate 보강
- [x] Phase 3. 실행 검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run build`
- `cd backend/crawler-playwright && npm run preview:emart:batch`
- `cd backend/crawler-playwright && npm run ingest:emart:batch`
- `bash scripts/verify-repo.sh`

## 리스크
- Emart 공개 검색은 일부 keyword에서 일반상품 fallback을 반환하므로 batch 성공률은 낮을 수 있다.
- Emart batch ingest는 안전장치 통과 건만 write하지만 실제 DB price/url을 갱신한다.
