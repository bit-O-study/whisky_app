# crawler-playwright

Node + Playwright 기반 파일럿 크롤러 런타임입니다.

## 현재 범위
- 기존 `backend/crawler` Selenium 런타임과 병행
- Emart/Lotteon 검색 결과 dry-run CLI 제공
- Emart/Lotteon 모두 batch preview/ingest 실행 가능
- preview 결과에는 `confidence`, `reviewNeeded`, `blockReason`, `autoWriteAllowed` 안전장치 판단이 포함됨
- 매칭 성공 시 `liquor_info.sub_category` 기반 `Blended`, `Single Malt`, `Bourbon` 같은 세부 분류를 `matchedLiquorInfo`에 포함
- Emart는 공개 검색 fallback 위험 때문에 신규 `liquor` insert를 자동 허용하지 않고 기존 row reuse/update 중심으로 운영

## 설치
```bash
cd backend/crawler-playwright
npm install
npm run install:browsers
```

## 환경변수
- Playwright 저장에는 `sql/ingest_existing_liquor.sql`의 서버 전용 RPC가 필요합니다. 가격·링크·가격 이력을 한 트랜잭션에 저장하며, 기존 마스터만 사용합니다. 함수 미설치 시 명시적으로 실패합니다. 2026-10-23 현재 운영 DB 반영은 별도 승인 대기 상태입니다.
- preview CLI는 서버 전용 Supabase 자격증명이 필요합니다.
- 기본 검색 순서:
  - `backend/crawler-playwright/.env`
  - `backend/.env`
  - `frontend/.env.local`

## 실행 예시
```bash
npm run crawl:emart -- --keyword "산토리 가쿠빈 700ml"
npm run preview:emart -- --keyword "산토리 가쿠빈 700ml"
npm run ingest:emart -- --keyword "산토리 가쿠빈 700ml"
npm run preview:emart:batch
npm run ingest:emart:batch
npm run crawl:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run preview:lotteon:batch
npm run ingest:lotteon:batch
npm run crawl:emart -- --keywords-file ./keywords.txt --limit 5
```

## 출력
- `artifacts/results/*.json`
- `artifacts/previews/*.json`
- `artifacts/writes/*.json`
- `artifacts/debug/*.html`
- `artifacts/traces/*.zip` (`--trace` 사용 시)

## 일일 운영 실행
- 일일 자동화 기준 경로는 Java/Selenium이며 `.github/workflows/lotteon-daily.yml`에 정의되어 있습니다.
- 매일 09:00 KST(00:00 UTC), 또는 수동 workflow_dispatch로 실행합니다. GitHub 예약 작업은 지연될 수 있습니다.
- 활성화 조건: 워크플로가 기본 브랜치에 반영되고 저장소 Actions secrets에 `DB_URL`(JDBC PostgreSQL 주소), `DB_USERNAME`, `DB_PASSWORD`가 있어야 합니다.
- `:crawler:bootRun --args='--spring.main.web-application-type=none --lotteon.batch=true'`가 실제 Java 배치를 실행합니다.
- 접속 설정 누락·검색 오류·저장 0건·DB 오류는 실패 처리합니다. 성공 로그는 `LOTTEON_DAILY_SUCCESS updated=N`입니다.
- 기본 브랜치 반영/시크릿 설정/첫 수동 실행 성공을 확인하기 전에는 자동 수집이 활성화됐다고 간주하지 않습니다.
- 테스트: Java `./gradlew :crawler:test`, Playwright 패키지 `npm run build && node --test tests/*.test.mjs`. SQL 원자성/권한 테스트는 메모리 PostgreSQL(PGlite)에서 실행됩니다.
