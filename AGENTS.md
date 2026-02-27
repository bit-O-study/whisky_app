# AGENTS 가이드: bitO-liquor

이 문서는 이 모노레포에서 작업하는 자율 코딩 에이전트를 위한 안내서입니다.
개인 취향보다 저장소의 기존 패턴을 우선하세요.

## 저장소 개요

- 백엔드 + 프론트엔드가 함께 있는 모노레포입니다.
- 백엔드: Java 21, Spring Boot 3.5.x, Gradle 멀티모듈
- 프론트엔드: React 19, TypeScript, Vite, Tailwind CSS v4
- 핵심 도메인 테이블: `public.liquors`

### 최상위 구조

- `backend/`: Spring 멀티모듈 프로젝트
- `backend/common`: 공용 JPA 엔티티, DTO, Repository
- `backend/api`: 조회/검색 API 애플리케이션 (`:8080`)
- `backend/crawler`: Selenium 크롤러 애플리케이션 (`:8081`)
- `frontend/`: Vite 기반 웹 UI
- `frontend/src/components`: React UI 컴포넌트
- `frontend/src/api`: API 어댑터/클라이언트
- `frontend/src/types`: 프론트 도메인 타입

## 명령어 가이드

별도 언급이 없으면 각 모듈 루트에서 실행합니다.

### 백엔드 (`backend/`)

- 전체 모듈 빌드: `./gradlew build`
- 전체 백엔드 테스트: `./gradlew test`
- API 서버 실행: `./gradlew :api:bootRun`
- 크롤러 서버 실행: `./gradlew :crawler:bootRun`

### 백엔드 단일 테스트 실행 (중요)

- 특정 모듈 테스트만 실행: `./gradlew :api:test`
- 테스트 클래스 1개 실행: `./gradlew :api:test --tests "org.bito.liquor.ApiApplicationTests"`
- 테스트 메서드 1개 실행: `./gradlew :api:test --tests "org.bito.liquor.ApiApplicationTests.contextLoads"`
- 패턴 기반 실행: `./gradlew :api:test --tests "*ApiApplicationTests"`

참고:
- `test` 태스크는 JUnit Platform(`useJUnitPlatform()`)을 사용합니다.
- Windows에서는 `gradlew.bat`을 사용하세요.

### 프론트엔드 (`frontend/`)

- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 타입체크 + 프로덕션 빌드: `npm run build` (`tsc -b && vite build`)
- 린트: `npm run lint`
- 빌드 미리보기: `npm run preview`
- E2E 테스트: `npm run test:e2e` (headless Chromium)
- E2E 헤디드 실행: `npm run test:e2e:headed`
- E2E UI 모드: `npm run test:e2e:ui`

### 프론트엔드 단일 테스트 상태

- 현재 프론트 기본 검증은 `npm run lint` + `npm run build`입니다.
- E2E는 Playwright를 사용하며 필요 시 `npm run test:e2e`를 실행하세요.

## 변경 유형별 검증 플로우

- 백엔드만 변경: `./gradlew test` (또는 `:module:test`)
- 프론트만 변경: `npm run lint` + `npm run build` (+ 필요 시 `npm run test:e2e`)
- 양쪽 모두 변경: 백엔드/프론트 검증 모두 수행
- 관련 검증 명령을 최소 1개 이상 실행하지 않았다면 완료로 보고하지 마세요.

## 코드 스타일: 백엔드 (Java/Spring)

### 포맷/구조

- 들여쓰기 4칸 스페이스, 탭 금지
- 패키지명은 소문자: `org.bito.liquor...`
- 클래스명: `UpperCamelCase`
- 메서드/필드명: `lowerCamelCase`
- 메서드는 작고 단일 책임 중심으로 유지

### import/어노테이션

- 와일드카드 import를 피하고 명시적으로 작성
- 현재 코드의 일반 순서: 프레임워크/앱 import 후 `java.*`
- Lombok 사용 빈도 높음 (`@RequiredArgsConstructor`, `@Getter`, `@Builder`)
- Spring stereotype은 명시적으로 사용 (`@Service`, `@RestController`, `@Repository`)

### 영속성/DTO 패턴

- JPA 엔티티 위치: `backend/common/.../model`
- Repository 인터페이스 위치: `backend/common/.../repository`
- API 레이어는 모델을 DTO로 매핑해 반환
- DB 컬럼명 보존이 필요하면 `@Column(name = ...)` 유지

### 에러 처리 패턴

- 서비스/컨트롤러는 기본적으로 명확한 성공 플로우 중심
- 스크래퍼는 아이템 단위 예외를 잡고 진행하는 복원력 패턴 사용
- 크롤러 치명 오류는 컨텍스트 포함 로그 (`log.error(..., e)`) 남김
- API/비즈니스 로직에서 치명 예외를 조용히 무시하지 말 것

## 코드 스타일: 프론트엔드 (React/TypeScript)

### TypeScript 제약

- 엄격 모드 사용 (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- API 응답/컴포넌트 props는 명시적 인터페이스 선호
- 타입 전용 import는 `import type` 사용
- `any` 지양, API 변환은 어댑터 함수에서 처리

### 네이밍/데이터 형태

- 컴포넌트 파일명: `PascalCase.tsx`
- 변수/함수명: `camelCase`
- 프론트 도메인 객체 필드는 의도적으로 `snake_case` 사용
- API 어댑터에서 백엔드 camelCase -> 프론트 snake_case로 변환

### React 패턴

- 함수형 컴포넌트 + 훅 사용
- 비동기 fetch는 `AbortController`와 방어적 상태 업데이트 패턴 사용
- UI 조각은 `components/`, API 호출은 `src/api`에 유지

### 포맷/import

- 현재 코드베이스는 quote/semicolon 스타일이 혼재
- 수정 시 해당 파일의 로컬 스타일을 따르고 대규모 포맷팅 금지
- import 그룹/순서는 불필요한 churn 없이 안정적으로 유지

## 테스트 가이드

- 백엔드 테스트 위치: `backend/*/src/test/java`
- 현재 샘플은 `@SpringBootTest` 기반
- 테스트 클래스명은 `*Tests` 관례를 주로 사용
- 프론트는 현재 테스트 러너가 구성되어 있지 않음

## 설정 및 보안

- 비밀값/자격증명은 절대 커밋하지 마세요.
- 백엔드 DB 설정은 환경변수(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) 기반
- 크롤러는 로컬 Chrome/Selenium 호환성에 의존
- 프론트-백엔드 연동 변경 시 로컬 CORS/API URL 동작 확인

## Git/PR 규칙

- Conventional Commits 사용 (`feat:`, `fix:`, `refactor:` 등)
- 커밋은 작고 범위를 명확히 분리 (api/crawler/frontend)
- PR에는 다음을 포함:
  - 동작 변화 요약
  - 실행한 검증 명령
  - 연결 이슈(있다면)
  - 프론트 시각 변경 시 스크린샷/GIF
