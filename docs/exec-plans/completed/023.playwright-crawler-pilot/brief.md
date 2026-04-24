# 023.playwright-crawler-pilot / brief

## 배경
- 현재 운영 크롤러는 `backend/crawler`의 Selenium + Spring Boot 런타임에 묶여 있다.
- 문서에는 이미 `backend/crawler-playwright`라는 별도 Node + Playwright 런타임 경계가 정의되어 있지만, 실제 패키지와 실행 진입점은 아직 없다.
- 사용자는 Selenium 제거 없이 Playwright를 병행 도입하고 싶어 하며, 우선은 안전한 파일럿 경로가 필요하다.

## 목표
- `backend/crawler-playwright` 패키지를 새로 만들고 Playwright 기반 크롤러 런타임의 진입점을 확보한다.
- 이마트 검색 결과를 대상으로 한 dry-run Playwright 파일럿 CLI를 제공한다.
- 기존 Selenium 런타임과 공존한다는 범위를 문서와 README에 명시한다.

## 비목표
- 기존 Selenium 코드 삭제 또는 엔드포인트 제거
- Playwright 런타임의 DB 직접 적재까지 이번 단계에서 완성
- 롯데온 등 모든 소스의 동시 이전

## 성공 기준
- `backend/crawler-playwright`에서 의존성 설치와 TypeScript 빌드가 가능하다.
- `npm run crawl:emart -- --keyword "산토리 가쿠빈 700ml"` 형태의 CLI가 동작해 이마트 검색 결과 dry-run JSON을 생성할 수 있다.
- 관련 실행 계획과 durable docs가 Playwright 병행 도입 기준으로 정리된다.

## 관련 문서
- [ARCHITECTURE.md](/home/ubuntu/code/bitO-liquor/ARCHITECTURE.md)
- [docs/ENVIRONMENTS.md](/home/ubuntu/code/bitO-liquor/docs/ENVIRONMENTS.md)
- [docs/REPO_MAP.md](/home/ubuntu/code/bitO-liquor/docs/REPO_MAP.md)
- [docs/design-docs/nextjs-supabase-migration.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/nextjs-supabase-migration.md)
