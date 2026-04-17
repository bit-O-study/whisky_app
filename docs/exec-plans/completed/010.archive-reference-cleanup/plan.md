# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 기록의 사건 자체는 유지하고, 현재 기준으로 읽는 데 필요한 경로명만 정리한다.
- 템플릿은 최소한의 구조만 제공하고, 개별 작업에서 과도한 형식 강제를 만들지 않는다.

## 작업 단계
- [x] Phase 1. 잔여 옛 경로 탐색
- [x] Phase 2. 완료 아카이브 대표 경로 정리
- [x] Phase 3. active 템플릿 추가

## 검증
- `rg -n "docs/issues|implementation-plan\\.md|memory/|/prd\\.md|\\bprd\\.md\\b" docs/exec-plans`
- `find docs/exec-plans/active -maxdepth 3 -type f | sort`
- `git diff --check -- docs/exec-plans`

## 리스크
- 일부 아카이브에는 당시 문맥을 설명하는 일반 명사형 `HANDOFF.md` 언급이 남을 수 있다.
- 모든 옛 표현을 강제로 치환하면 오히려 시간순 기록의 뉘앙스를 훼손할 수 있다.
