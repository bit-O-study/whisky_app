# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성
이 모노레포는 Spring Boot 백엔드와 React 프론트엔드로 구성됩니다. 백엔드 코드는 `backend/` 아래 Gradle 서브모듈로 나뉘며, `api`는 조회·검색 API(`:8080`), `crawler`는 Selenium 기반 크롤러(`:8081`), `common`은 공용 JPA 엔티티, DTO, Repository를 담당합니다. 프론트엔드 코드는 `frontend/`에 있으며, UI 컴포넌트는 `frontend/src/components`, API 어댑터는 `frontend/src/api`, 도메인 타입은 `frontend/src/types`, 정적 자산은 `frontend/public`, Playwright 테스트는 `frontend/tests`에 있습니다.

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
커밋 메시지는 `feat: ...`, `fix: ...`, `refactor: ...` 같은 Conventional Commits 형식을 따릅니다. 커밋은 `api`, `crawler`, `frontend`처럼 변경 영역별로 작게 유지하세요. PR에는 동작 변경 요약, 실행한 검증 명령, 관련 이슈 링크가 있으면 포함하고, 프론트 시각 변경이 있다면 스크린샷이나 GIF를 첨부하세요.

## 보안 및 설정 메모
비밀값은 절대 커밋하지 마세요. 백엔드 DB 설정은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 사용합니다. 프론트와 백엔드 연동을 바꿀 때는 로컬 CORS와 API URL 동작을 확인하고, 크롤러 작업 전에는 Chrome/Selenium 호환성을 점검하세요.
