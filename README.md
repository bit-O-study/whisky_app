# bitO-liquor

롯데온/이마트 주류 데이터를 수집하고 Next.js + Supabase 기반 카탈로그를 제공하는 모노레포입니다.

## 프로젝트 구성

- `backend/`: Java 21 + Spring Boot 멀티모듈
- `frontend/`: Next.js App Router + React 19 + TypeScript

백엔드 모듈:
- `backend/common`: 공통 엔티티, DTO, Repository
- `backend/api`: 보조 관리/업로드 성격의 Spring 애플리케이션 (`:8080`)
- `backend/crawler`: 크롤링 및 적재 애플리케이션 (`:8081`)

## 기술 스택

- Java 21
- Spring Boot 3.5.x
- Gradle 멀티모듈
- PostgreSQL (Supabase)
- Selenium WebDriver + Jsoup
- Next.js + React 19 + TypeScript + Tailwind CSS v4

## 빠른 시작

### 1. 백엔드 실행

```bash
cd backend
./gradlew :crawler:bootRun
```

조회 카탈로그는 Spring API가 아니라 Next.js에서 Supabase를 직접 조회합니다.
`backend/api`는 현재 핵심 조회 경로가 아니며, 필요 시에만 별도 실행합니다.
`backend/.env`가 있으면 `:crawler:bootRun`, `:api:bootRun` 실행 시 자동으로 로드됩니다.

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

기본 개발 서버 주소는 `http://localhost:3000`입니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`NEXT_PUBLIC_*`에는 공개 가능한 anon 또는 publishable 키만 넣어야 합니다.
`sb_secret_...` 형태의 키는 브라우저 노출 변수에 넣지 않고 서버 전용 변수(`SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_KEY`)로만 사용합니다.

## 환경 설정

백엔드와 크롤러는 Supabase Postgres 연결 정보가 필요합니다.

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

로컬 개발 시에는 `backend/.env`에 두면 `bootRun` 계열 명령에서 자동으로 반영됩니다.

추가로 `backend/api`의 이미지 업로드 기능을 쓸 경우 아래도 필요합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_STORAGE_BUCKET`

프론트는 Next.js 서버에서 Supabase를 조회하므로 아래 중 하나를 사용합니다.

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

로컬 개발 시에는 `frontend/.env.local`을 사용합니다.

## MCP 메모

- 저장소 로컬 MCP 설정은 `.mcp.json`을 사용합니다.
- Supabase MCP는 `bitO` 프로젝트 ref `jeqvxzkvumkiraclauvo` 기준으로 고정해 사용합니다.
- Supabase MCP personal access token은 파일에 직접 넣지 않고 셸 환경변수 `SUPABASE_ACCESS_TOKEN`으로 주입합니다.

## 주요 명령어

백엔드 (`backend/`):

```bash
./gradlew build
./gradlew test
./gradlew :crawler:bootRun
./gradlew :api:bootRun
```

프론트엔드 (`frontend/`):

```bash
npm run dev
npm run build
npm run lint
npm run start
npm run test:e2e
```

## 실행 메모

크롤링 엔드포인트 (`:8081`):

```bash
curl -X POST http://localhost:8081/api/crawl/lotteon
curl -X POST http://localhost:8081/api/crawl/emart
```

## 데이터 모델 메모

- 현재 카탈로그 핵심 테이블 초안은 `public.liquor`, `public.liquor_price`, `public.liquor_info`입니다.
- 스키마 초안은 `docs/issues/001.nextjs-supabase-migration/memory/supabase-schema-draft.sql`에 정리되어 있습니다.

## 주의사항

- Selenium 사용을 위해 로컬 Chrome 설치가 필요합니다.
- 사이트 구조 변경 시 크롤러 파서 수정이 필요합니다.
- `backend/crawler`는 `spring.jpa.hibernate.ddl-auto=validate`이므로 대상 DB에 스키마가 먼저 있어야 실행됩니다.
- 기본 이미지는 현재 Supabase Storage 공개 경로 fallback을 유지합니다.
