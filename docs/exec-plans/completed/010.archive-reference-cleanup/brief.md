# Brief

## 문제
- 문서 구조는 새 체계로 옮겼지만, 완료 아카이브 내부의 일부 기록은 여전히 옛 `docs/issues/*`, `prd.md`, `implementation-plan.md`, `memory/*` 표기를 유지하고 있다.
- 이 상태를 그대로 두면 실행 기록을 읽을 때 현재 기준 경로와 당시 표현이 섞여 혼란을 만든다.

## 목표
- 완료 아카이브 내부의 주요 경로 표기를 현재 문서 체계에 맞게 정리한다.
- 새 작업이 바로 시작될 수 있도록 `active` 템플릿 파일을 추가한다.

## 비목표
- 아카이브 서술의 시간순 사실관계 자체를 다시 쓰지 않는다.
- 이미 옮긴 내구 문서의 내용 범위를 다시 재설계하지 않는다.

## 성공 기준
- 완료 아카이브의 대표 참조가 `brief.md`, `plan.md`, `docs/references/*`, `docs/design-docs/*` 기준으로 읽힌다.
- `docs/exec-plans/active/_template/`에 복사 가능한 템플릿 세 파일이 존재한다.

## 관련 문서
- [PLANS.md](/home/ubuntu/code/bitO-liquor/docs/PLANS.md)
- [README.md](/home/ubuntu/code/bitO-liquor/README.md)
