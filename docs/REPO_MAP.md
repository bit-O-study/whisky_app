# REPO_MAP

## 목적
- 저장소의 변경 surface와 책임 경계를 한눈에 보여준다.
- 각 영역을 바꿀 때 어떤 문서와 검증을 따라야 하는지 연결한다.

## Top-Level Surface
- `frontend/`
  Next.js App Router 기반 사용자 읽기 경로와 내부 API route
- `backend/crawler/`
  Selenium 기반 수집/적재 경로
- `backend/crawler-playwright/`
  별도 Node + Playwright 기반 운영 크롤러 부트스트랩 패키지
- `backend/api/`
  보조 관리/업로드 성격의 API
- `backend/common/`
  JPA 엔티티, DTO, Repository 같은 공통 백엔드 도메인
- `docs/`
  product specs, design docs, exec plans, repo 운영 문서
- `docs/references/`
  시안, 캡처, SQL 초안 같은 원자료
- `docs/generated/`
  생성 스냅샷

## Primary Ownership
- `frontend/`
  읽기 경험, 제품 UI, 서버측 조회 orchestration
- `backend/crawler/`
  외부 쇼핑몰 수집과 DB 적재
- `backend/crawler-playwright/`
  Playwright 기반 크롤러 실험/전환용 운영 패키지
- `backend/api/`
  읽기 핵심 경로가 아닌 운영/보조 기능
- `backend/common/`
  crawler/api가 공유하는 저장 계층 계약

## Boundary Expectations
- 브라우저는 외부 데이터 저장소를 직접 다루지 않는다.
- Next.js 서버 계층이 카탈로그 읽기 모델을 구성한다.
- crawler는 DB 쓰기를 담당한다.
- application harness 문서는 `docs/design-docs/`, `docs/product-specs/`, `ARCHITECTURE.md`에 둔다.
- repo 운영 규칙은 `docs/REPOSITORY.md`와 그 하위 문서에 둔다.

## Change Entry Points
- UI/상호작용 변경
  `frontend/` + 관련 `product-specs`, `DESIGN`, `FRONTEND`
- 데이터 계약 변경
  `frontend/`, `backend/common/`, `backend/crawler/` + `ARCHITECTURE`, 관련 `design-docs`
- 적재/크롤링 변경
  `backend/crawler/`, `backend/crawler-playwright/`, 필요 시 `backend/common/` + `SECURITY`, `RELIABILITY`
- 문서 체계/운영 규칙 변경
  `AGENTS.md`, `docs/PLANS.md`, repo harness 문서
