# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성
이 모노레포는 Spring Boot 백엔드와 Next.js 프론트엔드로 구성됩니다. 백엔드 코드는 `backend/` 아래 Gradle 서브모듈로 나뉘며, `api`는 보조 관리/업로드 성격의 애플리케이션(`:8080`), `crawler`는 Selenium 기반 크롤러(`:8081`), `common`은 공용 JPA 엔티티, DTO, Repository를 담당합니다. 프론트엔드 코드는 `frontend/`에 있으며, App Router 엔트리는 `frontend/app`, 기능 코드는 `frontend/src/features`, 엔티티는 `frontend/src/entities`, 공통 모듈은 목표 경계인 `frontend/src/shared` 또는 현재 남아 있는 `frontend/src/lib`에, 정적 자산은 `frontend/public`, Playwright 테스트는 `frontend/tests`에 있습니다.

문서 작업은 아티팩트 기준으로 진행합니다.
- 제품 계약: `docs/product-specs/`
- 설계 결정: `docs/design-docs/`, `ARCHITECTURE.md`, `docs/FRONTEND.md`, `docs/DESIGN.md`
- 진행 중 실행 계획: `docs/exec-plans/active/<task-slug>/`
- 완료된 실행 기록: `docs/exec-plans/completed/<task-slug>/`
- 원자료: `docs/references/`
- 생성 스냅샷: `docs/generated/`

## 필수 문서 확인
이 저장소의 작업자는 현재 작업과 직접 연결된 내구 문서와 실행 계획을 먼저 확인해야 합니다.

최소 확인 순서는 아래를 기준으로 합니다.
- 구조/데이터/성능 변경: `ARCHITECTURE.md`, 관련 `docs/design-docs/*.md`
- 화면/기능 변경: 관련 `docs/product-specs/*.md`, 필요 시 `docs/DESIGN.md`, `docs/FRONTEND.md`
- 진행 중 작업이 이미 있으면 `docs/exec-plans/active/<task-slug>/brief.md`
- 이어서 `docs/exec-plans/active/<task-slug>/plan.md`
- 이어서 `docs/exec-plans/active/<task-slug>/progress.md`

## 문서 갱신 규칙
- 작업 시작 전 관련 spec/design 문서와 active 실행 계획을 확인합니다.
- 새 작업은 가능하면 `docs/exec-plans/active/<task-slug>/` 아래 `brief.md`, `plan.md`, `progress.md`로 시작합니다.
- 구조적 결정, 구현 방향 변경, 단계 완료가 생기면 관련 문서를 즉시 갱신합니다.
- 작업 중에는 최소한 해당 active 폴더의 `progress.md`를 최신 상태로 유지합니다.
- 구현이 계획을 벗어나면 `plan.md`를 수정합니다.
- 요구사항이나 범위가 바뀌면 관련 product spec 또는 `brief.md`를 수정합니다.
- 아키텍처 수준 변경이 크다면 `ARCHITECTURE.md` 또는 관련 `design-docs`를 즉시 갱신합니다.
- 작업이 끝나면 active 실행 계획을 `docs/exec-plans/completed/`로 이동하고, 장기 가치가 남는 내용만 내구 문서에 반영합니다.

## 빌드, 테스트, 개발 명령어
백엔드 명령은 `backend/`에서 실행합니다.
- `./gradlew build`: 전체 백엔드 모듈을 빌드하고 테스트를 실행합니다.
- `./gradlew test`: 전체 백엔드 테스트를 실행합니다.
- `./gradlew :api:bootRun`: API 서버를 로컬에서 실행합니다.
- `./gradlew :crawler:bootRun`: 크롤러 서버를 로컬에서 실행합니다.

프론트엔드 명령은 `frontend/`에서 실행합니다.
- `npm install`: 의존성을 설치합니다.
- `npm run dev`: Next.js 개발 서버를 실행합니다.
- `npm run build`: Next.js 프로덕션 빌드를 수행합니다.
- `npm run lint`: ESLint를 실행합니다.
- `npm run test`: Vitest 단위 테스트를 실행합니다.
- `npm run test:e2e`: Playwright E2E 테스트를 실행합니다.

## 코딩 스타일 및 네이밍 규칙
Java는 스페이스 4칸 들여쓰기를 사용하고, Spring 패키지명은 `org.bito.liquor...`처럼 소문자로 유지합니다. Java 클래스는 `UpperCamelCase`, 메서드와 필드는 `lowerCamelCase`를 사용합니다. 프론트엔드는 컴포넌트 파일명을 `PascalCase.tsx`, 함수명은 `camelCase`로 작성하고, 프론트 도메인 필드는 `snake_case`를 유지합니다. TypeScript에서는 `import type`을 우선하고 `any`는 피하며, 광범위한 포맷팅보다 기존 파일의 quote·semicolon 스타일을 따르세요.

## 테스트 가이드
백엔드 테스트는 `backend/*/src/test/java`에 두며, 일반적으로 JUnit Platform 기반 `@SpringBootTest`를 사용합니다. 테스트 클래스명은 `ApiApplicationTests`처럼 `*Tests` 패턴을 따릅니다. 프론트 기본 검증은 `npm run lint`, `npm run build`, `npm run test`이며, UI 흐름이나 API 연동 동작이 바뀌면 `npm run test:e2e`도 실행하세요.

## 커밋 및 Pull Request 가이드
커밋 메시지는 `feat: ...`, `fix: ...`, `refactor: ...` 같은 Conventional Commits 형식을 따르며, 제목과 설명은 한국어로 작성합니다. 커밋은 `api`, `crawler`, `frontend`처럼 변경 영역별로 작게 유지하세요. PR에는 동작 변경 요약, 실행한 검증 명령, 관련 이슈 링크가 있으면 포함하고, 프론트 시각 변경이 있다면 스크린샷이나 GIF를 첨부하세요.
- 기능 단위 작업이 끝날 때마다 해당 변경만 묶어서 바로 커밋합니다.
- 문서 변경도 기능 단위 커밋과 함께 포함해 작업 경계가 커밋 히스토리에서 드러나도록 유지합니다.

## 보안 및 설정 메모
비밀값은 절대 커밋하지 마세요. 백엔드 DB 설정은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 사용합니다. 프론트와 백엔드 연동을 바꿀 때는 로컬 CORS와 API URL 동작을 확인하고, 크롤러 작업 전에는 Chrome/Selenium 호환성을 점검하세요.
