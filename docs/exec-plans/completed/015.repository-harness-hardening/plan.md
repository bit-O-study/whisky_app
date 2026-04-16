# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- repo harness 변경이므로 관련 운영 문서를 먼저 갱신할 방향을 정하고, 이후 하위 가이드와 자동 검증 표면을 추가한다.
- 검증은 새 repo verify 스크립트와 기존 프론트 lint/test/build/e2e 흐름 중 변경 영향에 맞는 최소 세트를 실행한다.

## 작업 단계
- [x] Phase 1. 조사와 범위 확정
- [x] Phase 2. 구현
- [x] Phase 3. 검증과 문서 정리

## 검증
- `bash scripts/verify-repo.sh`
- 필요 시 `frontend/npm run lint`

## 리스크
- 기존 completed exec plan 번호 중복을 새 규칙이 즉시 실패로 만들 수 있다.
- 문서 규칙 자동화는 shell 환경 가정에 일부 의존한다.
