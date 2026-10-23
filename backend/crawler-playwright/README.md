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
- Playwright 저장에는 `sql/ingest_existing_liquor.sql`의 서버 전용 RPC가 필요합니다. 가격·링크·가격 이력을 한 트랜잭션에 저장하며, 기존 마스터만 사용합니다. 함수 미설치 시 명시적으로 실패합니다. 2026-10-23 사용자 승인 후 운영 DB에 반영했습니다.
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
- `.github/workflows/lotteon-daily.yml`: 매일 09:00 KST(00:00 UTC). GitHub 예약 실행은 지연될 수 있습니다.
- `node dist/cli/daily-lotteon.js`가 공개 운영 카탈로그의 기존 LOTTEON 상품을 수집합니다. `--dry-run --limit 3`으로 저장 없이 점검할 수 있습니다.
- 기존 상품 코드와 일치하는 가격만 GitHub OIDC 증명과 함께 운영 웹서버에 전달합니다. DB 키/비밀번호를 Actions에 복사하지 않습니다.
- 운영 서버는 저장소 ID, main, 정확한 workflow_ref, schedule/workflow_dispatch, 서명·발급자·대상·유효시간을 검증합니다. 다른 저장소/PR/일반 사용자 요청은 거부합니다.
- 가격·링크·이력은 상품별 하나의 RPC 트랜잭션으로 저장됩니다. 상품 코드 불일치는 건너뛰고, 수집/저장 오류 또는 저장 0건은 작업을 실패시킵니다. 결과는 artifacts/daily에 남습니다.
- main 배포와 첫 수동 실행 성공을 확인하기 전에는 자동 수집이 활성화됐다고 간주하지 않습니다.
- Java 배치는 DB 설정이 있는 수동 환경에서 `:crawler:bootRun --args='--spring.main.web-application-type=none --lotteon.batch=true'`로 사용할 수 있습니다.
- 검증: Java `./gradlew :crawler:test`, Node `npm run build && node --test tests/*.test.mjs`, 프론트 `npm test && npm run lint && npm run build`.