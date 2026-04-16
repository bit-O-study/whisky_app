# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 현재 문서군을 application harness와 repository harness로 분리해 읽히게 만든다.
- repo 운영 레이어는 중복 설명보다 "무엇을 먼저 보고, 무엇을 갱신하고, 무엇을 검증해야 하는가"를 명확히 하는 데 집중한다.

## 작업 단계
- [x] Phase 1. 현재 문서군 재검토
- [x] Phase 2. repo harness 문서 추가
- [x] Phase 3. 상위 문서 연결
- [x] Phase 4. 검증 및 기록 정리

## 검증
- `rg -n "REPO_MAP|CHANGE_POLICY|INTERFACE_MATRIX|ENVIRONMENTS" AGENTS.md README.md ARCHITECTURE.md docs -S`
- 링크 경로 존재 확인
- `git diff --check -- AGENTS.md README.md ARCHITECTURE.md docs`

## 리스크
- repo 운영 문서가 application harness 내용을 다시 복제하면 중복 관리가 생긴다.
- 너무 추상적으로 쓰면 실제 작업에 도움이 안 되고, 너무 구체적으로 쓰면 빠르게 낡는다.
