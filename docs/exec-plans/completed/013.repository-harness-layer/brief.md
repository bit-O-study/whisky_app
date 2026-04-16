# Brief

## 문제
- 현재 저장소는 `application level harness engineering` 문서는 충분하지만, `repository level harness engineering`은 운영 규칙이 여러 문서에 흩어져 있다.
- 그래서 다음 작업자가 "이 repo에서 어떤 종류의 변경이 들어오면 어떤 문서와 검증과 경계를 따라야 하는가"를 한 번에 파악하기 어렵다.

## 목표
- 저장소 운영 레이어를 명시하는 repo harness 문서를 추가한다.
- 변경 surface, 변경 정책, 인터페이스 경계, 환경/시크릿 경계를 repo 기준으로 정리한다.
- 기존 application harness 문서와 충돌하지 않도록 상위 문서에서 참조 관계를 명확히 한다.

## 비목표
- 앱 기능이나 코드 구조를 다시 변경하지 않는다.
- 기존 product spec이나 design doc의 세부 내용을 다시 설계하지 않는다.

## 성공 기준
- `docs/REPO_MAP.md`, `docs/CHANGE_POLICY.md`, `docs/INTERFACE_MATRIX.md`, `docs/ENVIRONMENTS.md`가 추가된다.
- `AGENTS.md`, `README.md`, `ARCHITECTURE.md`에서 repo 운영 레이어를 참조한다.
- repository harness와 application harness의 역할 구분이 문서상 명확하다.

## 관련 문서
- [AGENTS.md](/home/ubuntu/code/bitO-liquor/AGENTS.md)
- [ARCHITECTURE.md](/home/ubuntu/code/bitO-liquor/ARCHITECTURE.md)
- [docs/PLANS.md](/home/ubuntu/code/bitO-liquor/docs/PLANS.md)
