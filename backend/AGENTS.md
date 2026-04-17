# Repository Guidelines

## 프로젝트 구조 및 모듈 구성
- 멀티모듈 Gradle 프로젝트: `api`, `crawler`, `common`.
- `api`: 보조 관리/업로드 성격의 Spring 애플리케이션 (`api/src/main/java`, `api/src/main/resources`, 기본 포트 `:8080`). 현재 카탈로그의 핵심 읽기 경로를 소유하지 않습니다.
- `crawler`: Selenium 기반 크롤링 및 적재 애플리케이션 (`crawler/src/main/java`, `crawler/src/main/resources`, 기본 포트 `:8081`).
- `common`: 공통 엔티티, DTO, Repository 같은 백엔드 공유 도메인 계층 (`common/src/main/java`).
- 테스트: 모듈별 `*/src/test/java/` (JUnit/Spring Boot).
- 빌드 산출물: 각 모듈의 `*/build/` 및 루트 `build/` (Gradle 생성).

## 아키텍처 경계
- 핵심 카탈로그 읽기 경로는 Spring API가 아니라 `frontend/`의 Next.js 서버 계층입니다.
- `backend/api`는 별도 운영성 기능이나 업로드 관리 기능이 필요할 때만 확장합니다.
- `backend/crawler`가 외부 쇼핑몰 데이터 수집과 DB write를 담당합니다.
- `backend/common` 계약을 바꿀 때는 `ARCHITECTURE.md`, 관련 `docs/design-docs/*.md`, `docs/generated/db-schema.md` 반영 여부를 함께 확인하세요.

## 빌드, 테스트, 개발 명령어
- `./gradlew build`: 전체 모듈 컴파일과 테스트를 수행합니다.
- `./gradlew test`: 전체 모듈 테스트만 실행합니다.
- `./gradlew :api:bootRun`: 보조 관리/업로드 API 앱을 실행합니다. 기본 주소는 `http://localhost:8080`입니다.
- `./gradlew :crawler:bootRun`: 크롤러 앱을 실행합니다. 기본 주소는 `http://localhost:8081`입니다.

Windows에서는 `gradlew.bat`을 사용하세요.

## 코딩 스타일 및 네이밍 규칙
- Java 21, Spring Boot 관례를 따릅니다.
- 들여쓰기: 스페이스 4칸, 탭 사용 금지.
- 패키지: 소문자 (`org.bito.liquor.controller`).
- 클래스: `UpperCamelCase` (예: `LotteonScraper`).
- 메서드/필드: `lowerCamelCase`.
- 별도 포매터는 없으니, 기존 코드 스타일과 import 정렬을 유지하세요.

## 테스트 가이드
- 프레임워크: Spring Boot Test (JUnit Platform).
- 테스트 클래스는 모듈별 `*/src/test/java/`에 두고 `*Tests` 접미사를 권장합니다 (예: `ApiApplicationTests`).
- 새 기능은 서비스 로직, repository 계약, 스크래퍼 로직을 중심으로 테스트를 추가하세요.
- 크롤러/데이터 계약 변경 시 `ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`와의 정합성을 함께 확인하세요.

## 커밋 및 PR 가이드
- 커밋 메시지는 Conventional Commits를 따릅니다 (예: `feat: ...`, `feat(scraper): ...`).
- 작고 명확한 단위로 커밋하세요.
- PR에는 변경 요약, 관련 이슈 링크(있다면), 검증 방법을 포함하세요.
- API/스크래핑 변경 시 `curl` 예시나 로그 샘플을 첨부하면 좋습니다.

## 설정 및 보안 참고
- DB 설정은 모듈별 `application.properties`(`api/src/main/resources/application.properties`, `crawler/src/main/resources/application.properties`)에서 환경 변수로 읽습니다.
  - `DB_URL` (기본값: `jdbc:postgresql://localhost:5432/postgres`)
  - `DB_USERNAME` (기본값: `postgres`)
  - `DB_PASSWORD` (기본값: 빈 값)
- `backend/api` 업로드/스토리지 연계는 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET`를 사용합니다.
- 스크래퍼는 Selenium/Chrome에 의존하므로 로컬에 Chrome이 설치되어 있어야 합니다.
