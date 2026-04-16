# CHANGE_POLICY

## 목적
- 변경 종류마다 선행 문서와 최소 검증을 고정한다.
- 실행 기록에만 머무를 내용과 내구 문서로 승격할 내용을 구분한다.

## Change Classes

### 1. UI / Interaction
- 예
  카탈로그 레이아웃, 카드 상호작용, 상세 페이지 표현 변경
- 먼저 볼 문서
  `docs/product-specs/*.md`, `docs/DESIGN.md`, `docs/FRONTEND.md`
- 함께 갱신할 문서
  기능 계약이 바뀌면 `product-specs`, 장기 디자인 원칙이 바뀌면 `DESIGN`
- 최소 검증
  `npm run lint`, `npm run build`, 필요 시 `npm run test`, `npm run test:e2e`

### 2. Frontend Structure / Orchestration
- 예
  feature 경계 이동, model/repository 분리, 서버 선조회 방식 조정
- 먼저 볼 문서
  `ARCHITECTURE.md`, `docs/FRONTEND.md`, 관련 `design-docs`
- 함께 갱신할 문서
  `docs/design-docs/frontend-clean-architecture.md`, 필요 시 `ARCHITECTURE.md`
- 최소 검증
  `npm run lint`, `npm run build`, `npm run test`

### 3. Data Contract / Read Model
- 예
  카드 모델, 상세 모델, `vendors[]` 계약, 검색 read model 변경
- 먼저 볼 문서
  `ARCHITECTURE.md`, `docs/design-docs/supabase-data-model.md`, `docs/design-docs/catalog-vendor-pricing-contract.md`
- 함께 갱신할 문서
  관련 `design-docs`, `docs/generated/db-schema.md`, 필요 시 `product-specs`
- 최소 검증
  `npm run lint`, `npm run build`, `npm run test`

### 4. Crawler / Write Path
- 예
  적재 방식, upsert 기준, 수집 파이프라인 변경
- 먼저 볼 문서
  `ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`, `backend/AGENTS.md`
- 함께 갱신할 문서
  관련 `design-docs`, 필요 시 `ARCHITECTURE.md`
- 최소 검증
  `./gradlew test`, 필요 시 `./gradlew :crawler:bootRun`

### 5. Repository Operations
- 예
  문서 구조, exec plan lifecycle, quality gate, 환경 규칙 변경
- 먼저 볼 문서
  `AGENTS.md`, `docs/REPOSITORY.md`, `docs/PLANS.md`, `docs/QUALITY_SCORE.md`
- 함께 갱신할 문서
  repo harness 문서, 필요 시 `README.md`
- 최소 검증
  `bash scripts/verify-repo.sh`, 변경 규칙에 대한 self-review

## Promotion Rule
- 작업 중 판단과 단계별 로그는 `docs/exec-plans/active/<slug>/`에 둔다.
- 완료 후에도 장기 가치가 없으면 `completed/`에만 남긴다.
- 반복될 규칙, 제품 계약, 구조 결정은 `product-specs/`, `design-docs/`, 루트 문서로 승격한다.

## Default Rule
- 변경이 2개 이상 change class를 동시에 건드리면, 더 상위 문서를 먼저 갱신한다.
- 예
  UI와 데이터 계약을 동시에 바꾸면 `design-docs`와 `product-specs`를 둘 다 본다.
