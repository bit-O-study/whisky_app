# REPOSITORY

## 역할
- 이 문서는 `repository level harness engineering`의 진입점이다.
- 목적은 "이 앱이 무엇인가"보다 "이 저장소를 어떻게 바꾸는가"를 규정하는 것이다.
- 제품/기능/아키텍처 자체는 application harness 문서가 설명한다.

## Repository Harness
- 저장소 surface와 책임: [REPO_MAP.md](/home/ubuntu/code/bitO-liquor/docs/REPO_MAP.md)
- 변경 종류별 문서/검증 규칙: [CHANGE_POLICY.md](/home/ubuntu/code/bitO-liquor/docs/CHANGE_POLICY.md)
- 내부 인터페이스와 허용 경계: [INTERFACE_MATRIX.md](/home/ubuntu/code/bitO-liquor/docs/INTERFACE_MATRIX.md)
- 환경/시크릿/실행 경계: [ENVIRONMENTS.md](/home/ubuntu/code/bitO-liquor/docs/ENVIRONMENTS.md)

## Application Harness
- 시스템 경계와 데이터 흐름: [ARCHITECTURE.md](/home/ubuntu/code/bitO-liquor/ARCHITECTURE.md)
- 제품 계약: [docs/product-specs/index.md](/home/ubuntu/code/bitO-liquor/docs/product-specs/index.md)
- 설계 결정: [docs/design-docs/index.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/index.md)
- 실행 기록: [docs/PLANS.md](/home/ubuntu/code/bitO-liquor/docs/PLANS.md)

## 운영 원칙
- repo harness는 작업 순서와 품질 게이트를 규정한다.
- application harness는 현재 bitO-liquor의 동작과 설계를 규정한다.
- 실제 변경 시에는 repo harness를 먼저 확인하고, 이어서 관련 application harness 문서를 갱신한다.
