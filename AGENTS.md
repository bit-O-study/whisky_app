# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성
이 모노레포는 Spring Boot 백엔드와 React 프론트엔드로 구성됩니다. 백엔드 코드는 `backend/` 아래 Gradle 서브모듈로 나뉘며, `api`는 조회·검색 API(`:8080`), `crawler`는 Selenium 기반 크롤러(`:8081`), `common`은 공용 JPA 엔티티, DTO, Repository를 담당합니다. 프론트엔드 코드는 `frontend/`에 있으며, UI 컴포넌트는 `frontend/src/components`, API 어댑터는 `frontend/src/api`, 도메인 타입은 `frontend/src/types`, 정적 자산은 `frontend/public`, Playwright 테스트는 `frontend/tests`에 있습니다.

문서 작업은 `docs/issues/<issue-name>/` 기준으로 진행합니다. 각 이슈 디렉터리에는 `prd.md`를 두고, 진행 중 메모는 `memory/implementation-plan.md`, `memory/progress.md`에 정리합니다.

## 필수 문서 확인
이 저장소의 작업자는 항상 현재 작업 중인 이슈 문서를 먼저 조회하고, 작업 중 변경사항이 생기면 즉시 해당 문서를 수정해야 합니다.

현재 작업 중인 이슈가 `docs/issues/<issue-name>/` 아래에 있다면, 최소한 아래 문서를 먼저 확인합니다.
- `docs/issues/<issue-name>/prd.md`
- `docs/issues/<issue-name>/memory/implementation-plan.md`
- `docs/issues/<issue-name>/memory/progress.md`

## 문서 갱신 규칙
- 작업 시작 전 현재 PRD, 구현 계획, 진행 상태를 확인합니다.
- 구조적 결정, 구현 방향 변경, 단계 완료가 생기면 관련 문서를 바로 갱신합니다.
- 새 작업을 마칠 때는 최소한 `progress.md`를 최신 상태로 유지합니다.
- 구현이 계획을 벗어나면 `implementation-plan.md`를 수정합니다.
- 요구사항이나 범위가 바뀌면 `prd.md`를 수정합니다.
- 아키텍처 수준 변경이 크다면 `implementation-plan.md`에 즉시 반영하고, 필요하면 별도 결정 문서를 추가합니다.

## 빌드, 테스트, 개발 명령어
백엔드 명령은 `backend/`에서 실행합니다.
- `./gradlew build`: 전체 백엔드 모듈을 빌드하고 테스트를 실행합니다.
- `./gradlew test`: 전체 백엔드 테스트를 실행합니다.
- `./gradlew :api:bootRun`: API 서버를 로컬에서 실행합니다.
- `./gradlew :crawler:bootRun`: 크롤러 서버를 로컬에서 실행합니다.

프론트엔드 명령은 `frontend/`에서 실행합니다.
- `npm install`: 의존성을 설치합니다.
- `npm run dev`: Vite 개발 서버를 실행합니다.
- `npm run build`: `tsc -b`와 프로덕션 빌드를 수행합니다.
- `npm run lint`: ESLint를 실행합니다.
- `npm run test:e2e`: Playwright E2E 테스트를 실행합니다.

## 코딩 스타일 및 네이밍 규칙
Java는 스페이스 4칸 들여쓰기를 사용하고, Spring 패키지명은 `org.bito.liquor...`처럼 소문자로 유지합니다. Java 클래스는 `UpperCamelCase`, 메서드와 필드는 `lowerCamelCase`를 사용합니다. 프론트엔드는 컴포넌트 파일명을 `PascalCase.tsx`, 함수명은 `camelCase`로 작성하고, 프론트 도메인 필드는 `snake_case`를 유지합니다. TypeScript에서는 `import type`을 우선하고 `any`는 피하며, 광범위한 포맷팅보다 기존 파일의 quote·semicolon 스타일을 따르세요.

## 테스트 가이드
백엔드 테스트는 `backend/*/src/test/java`에 두며, 일반적으로 JUnit Platform 기반 `@SpringBootTest`를 사용합니다. 테스트 클래스명은 `ApiApplicationTests`처럼 `*Tests` 패턴을 따릅니다. 프론트 기본 검증은 `npm run lint`와 `npm run build`이며, UI 흐름이나 API 연동 동작이 바뀌면 `npm run test:e2e`도 실행하세요.

## 커밋 및 Pull Request 가이드
커밋 메시지는 `feat: ...`, `fix: ...`, `refactor: ...` 같은 Conventional Commits 형식을 따르며, 제목과 설명은 한국어로 작성합니다. 커밋은 `api`, `crawler`, `frontend`처럼 변경 영역별로 작게 유지하세요. PR에는 동작 변경 요약, 실행한 검증 명령, 관련 이슈 링크가 있으면 포함하고, 프론트 시각 변경이 있다면 스크린샷이나 GIF를 첨부하세요.

## 보안 및 설정 메모
비밀값은 절대 커밋하지 마세요. 백엔드 DB 설정은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 사용합니다. 프론트와 백엔드 연동을 바꿀 때는 로컬 CORS와 API URL 동작을 확인하고, 크롤러 작업 전에는 Chrome/Selenium 호환성을 점검하세요.
