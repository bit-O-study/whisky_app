# CONSTITUTION

## 서문
- 이 저장소는 "신뢰 가능한 주류 가격 비교 시스템"을 지속적으로 개선하기 위한 작업 공간이다.
- 이 문서는 repository harness와 application harness를 함께 지배하는 최상위 규범이다.
- 다른 문서는 이 헌법을 구체화하거나 실행하는 역할을 하며, 헌법과 충돌할 수 없다.

## 문서 우선순위
1. `CONSTITUTION.md`
2. `AGENTS.md`, `docs/REPOSITORY.md`, `docs/REPO_MAP.md`, `docs/CHANGE_POLICY.md`, `docs/INTERFACE_MATRIX.md`, `docs/ENVIRONMENTS.md`
3. `ARCHITECTURE.md`, `docs/design-docs/*`, `docs/product-specs/*`, `docs/DESIGN.md`, `docs/FRONTEND.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`, `docs/QUALITY_SCORE.md`
4. `docs/exec-plans/active/*`, `docs/exec-plans/completed/*`
5. `docs/references/*`, `docs/generated/*`

## 제1조 목적
- 우리는 "예쁜 화면"보다 "믿을 수 있는 가격 비교"를 우선한다.
- 카탈로그는 탐색 진입점이고, 상세 페이지는 비교를 이어가는 보강 경로다.
- 디자인, 아키텍처, 운영 규칙은 모두 이 목적을 보존하는 방향으로 진화해야 한다.

## 제2조 시스템 모델
- 읽기 경로의 중심은 Next.js 서버 계층이다.
- 쓰기 경로의 중심은 `backend/crawler`다.
- `backend/api`는 보조 관리/업로드성 기능을 담당하며, 현재 카탈로그의 기본 읽기 경로를 다시 소유하지 않는다.
- 브라우저는 서버 전용 경계를 직접 넘지 않는다.

## 제3조 데이터와 계약
- 카탈로그 카드 1장은 하나의 `liquor` 엔티티를 나타낸다.
- 가격 계약의 기본 단위는 `vendors[]`다.
- 데이터 계약 변경은 UI 변경보다 먼저 문서에 반영한다.
- 보조 읽기 모델은 현재 제품 계약을 깨지 않는 범위에서만 도입한다.

## 제4조 프론트엔드 원칙
- 프론트엔드는 `entities / features / shared`를 목표 구조로 한다.
- UI는 렌더링과 입력 처리에 집중한다.
- orchestration, 매핑, 응답 정규화는 UI 밖에 둔다.
- 현재 구조가 목표 상태와 다를 경우, 그 차이는 문서에 명시해야 한다.

## 제5조 저장소 운영 원칙
- 모든 변경은 먼저 change class를 식별한다.
- 저장소 운영 규칙을 바꾸는 작업은 repo harness 문서를 먼저 갱신한다.
- 제품 계약, 설계 결정, 실행 기록, 원자료는 서로 다른 계층으로 유지한다.
- 반복 가치가 있는 판단만 durable docs로 승격한다.

## 제6조 증거와 검증
- 검증 없이 완료를 주장하지 않는다.
- 작업 중 판단과 단계별 로그는 `docs/exec-plans/active/`에 둔다.
- 완료된 작업은 `docs/exec-plans/completed/`로 이동한다.
- 변경 종류에 맞는 최소 검증을 수행하고, 남은 리스크는 숨기지 않는다.

## 제7조 보안과 환경 경계
- 비밀값은 저장소에 커밋하지 않는다.
- 브라우저에는 공개 가능한 값만 둔다.
- 서버/크롤러만 서비스 키와 DB 자격증명을 사용한다.
- 환경 차이와 도구 연결 불일치가 있으면 문서에 명시한다.

## 제8조 개정
- 헌법 변경은 repository operations 변경으로 취급한다.
- 헌법을 바꾸면 최소한 `AGENTS.md`, `docs/REPOSITORY.md`, `README.md`, 관련 durable docs를 함께 검토한다.
- 개정은 변경 이유, 영향 범위, 검증 근거를 남겨야 한다.
