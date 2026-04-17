# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 헌법은 세부 구현서가 아니라 최상위 규범 문서로 쓴다.
- 기존 repo/application harness 문서를 다시 복제하지 않고, 우선순위와 불변 원칙만 압축한다.

## 작업 단계
- [x] Phase 1. 상위 원칙 추출
- [x] Phase 2. `CONSTITUTION.md` 초안 작성
- [x] Phase 3. 상위 문서 참조 연결
- [x] Phase 4. 검증과 기록 정리

## 검증
- `rg -n "CONSTITUTION\\.md" AGENTS.md README.md ARCHITECTURE.md docs -S`
- 링크 경로 존재 확인
- `git diff --check -- CONSTITUTION.md AGENTS.md README.md ARCHITECTURE.md docs`

## 리스크
- 헌법이 너무 구체적이면 설계 문서와 중복되고 빠르게 낡는다.
- 헌법이 너무 추상적이면 실제 작업 규범으로 작동하지 않는다.
