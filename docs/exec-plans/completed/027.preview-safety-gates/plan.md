# 027.preview-safety-gates / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- preview 산출물에 안전장치 전용 레이어를 추가하고 실제 write 로직과는 분리한다.
- 점수, 신규 insert 여부, 기존 후보 충돌 여부를 기반으로 1차 판단을 내린다.
- 우선은 운영 위험이 큰 `low score`, `conflicting existing candidates`, `LOTTEON new insert`를 차단 규칙으로 둔다.

## 작업 단계
- [x] Phase 1. safety gate 규칙 확정
- [x] Phase 2. 구현
- [x] Phase 3. 재검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run preview:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`
- `cd backend/crawler-playwright && npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `bash scripts/verify-repo.sh`

## 리스크
- 초기 규칙은 보수적이어서 실제로 적재 가능한 건도 review 대상으로 분류할 수 있다.
