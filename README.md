# bitO-liquor

롯데온/이마트 주류 데이터를 수집하고 조회 API를 제공하는 모노레포입니다.

## 프로젝트 구성

- `backend/`: Java 21 + Spring Boot 멀티모듈
- `frontend/`: React 19 + TypeScript + Vite (백엔드 API 연동 UI)

백엔드 모듈:
- `backend/common`: 공통 엔티티, DTO, Repository
- `backend/api`: 조회/검색 API 서버 (`:8080`)
- `backend/crawler`: 크롤링 실행 서버 (`:8081`)

## 기술 스택

- Java 21
- Spring Boot 3.5.x
- Gradle 멀티모듈
- PostgreSQL (Supabase)
- Selenium WebDriver + Jsoup
- React 19 + TypeScript + Vite + Tailwind CSS v4

## 빠른 시작

### 1. 백엔드 실행

```bash
cd backend
./gradlew :api:bootRun
./gradlew :crawler:bootRun
```

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

기본 API 주소는 `http://localhost:8080`이며, 필요하면 `frontend/.env`에 아래를 설정해 변경할 수 있습니다.

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## 환경 설정

백엔드는 DB 연결 정보가 필요합니다.

- API: `backend/api/src/main/resources/application-local.properties.example`
- Crawler: `backend/crawler/src/main/resources/application-local.properties.example`

각 파일을 `application-local.properties`로 복사한 뒤 값을 채워 사용하세요.

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=your_local_db_user
spring.datasource.password=your_local_db_password
```

## 주요 명령어

백엔드 (`backend/`):

```bash
./gradlew build
./gradlew test
./gradlew :api:bootRun
./gradlew :crawler:bootRun
```

프론트엔드 (`frontend/`):

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run test:e2e
```

## API 엔드포인트

조회 API (`:8080`):

```bash
curl http://localhost:8080/api/liquors
curl "http://localhost:8080/api/liquors/search?q=조니워커"
```

크롤링 API (`:8081`):

```bash
curl -X POST http://localhost:8081/api/crawl/lotteon
curl -X POST http://localhost:8081/api/crawl/emart
```

## 데이터 모델 메모

- 현재 핵심 상품 테이블은 `public.liquors`입니다.

## 주의사항

- Selenium 사용을 위해 로컬 Chrome 설치가 필요합니다.
- 사이트 구조 변경 시 크롤러 파서 수정이 필요합니다.
- 테스트 실행 시 DB 설정이 없으면 `contextLoads`가 실패할 수 있습니다.
