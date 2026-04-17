# Brief

## 문제
- 저장소 하네스 문서는 비교적 잘 정리돼 있지만, 하위 범위 안내와 저장소 규칙 자동 검증 표면이 부족하다.
- 특히 `backend/AGENTS.md` 설명이 루트 아키텍처 문서와 어긋나고, 프론트엔드 범위에는 하위 진입점 문서가 없다.
- 실행 계획 번호 중복과 필수 파일 누락 같은 저장소 운영 규칙도 현재는 사람 리뷰에만 의존한다.

## 목표
- 백엔드 하위 가이드를 현재 아키텍처와 일치시킨다.
- 프론트엔드 범위용 `AGENTS.md`를 추가해 즉시 작업 진입점을 보강한다.
- 저장소 운영 규칙을 점검하는 `scripts/verify-repo.sh`와 GitHub Actions 워크플로우를 추가한다.
- 관련 repo harness 문서를 최신화한다.

## 비목표
- 백엔드 CI 추가/개편
- 제품 기능 또는 런타임 아키텍처 변경
- 대규모 문서 재구성

## 성공 기준
- `backend/AGENTS.md`가 루트 문서의 시스템 모델과 모순되지 않는다.
- `frontend/AGENTS.md`가 존재하고 프론트엔드 작업 규칙을 안내한다.
- `scripts/verify-repo.sh`가 통과하며, completed exec plan 번호 중복과 active plan 필수 파일 누락을 감지할 수 있다.
- repo harness 문서와 CI가 새 검증 표면을 반영한다.

## 관련 문서
- `CONSTITUTION.md`
- `docs/REPOSITORY.md`
- `docs/CHANGE_POLICY.md`
- `docs/PLANS.md`
- `docs/QUALITY_SCORE.md`
- `ARCHITECTURE.md`
- `docs/FRONTEND.md`
