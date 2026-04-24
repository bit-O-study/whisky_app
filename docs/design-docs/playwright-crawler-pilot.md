# Playwright Crawler Pilot

## 결정
- 기존 `backend/crawler` Selenium 런타임은 유지한다.
- 별도 Node + Playwright 패키지 `backend/crawler-playwright`를 신규 추가한다.
- 첫 단계는 Emart 검색 결과를 dry-run으로 수집하는 파일럿 CLI를 제공한다.

## 이유
- 문서상으로는 이미 `crawler-playwright runtime` 경계가 존재하지만 실제 실행 패키지가 없었다.
- Playwright는 locator/auto-waiting/trace tooling이 강해 현대 쇼핑몰 검색 페이지를 다루기 유리하다.
- 기존 Selenium 런타임을 바로 제거하지 않고 병행 도입하면 운영 리스크를 낮출 수 있다.

## 현재 범위
- 런타임 위치: `backend/crawler-playwright`
- 현재 파일럿 소스: Emart, Lotteon
- 실행 형태: HTTP 서버가 아닌 CLI 배치
- 출력 형태: 결과 JSON + 선택적 trace/debug HTML 아티팩트

## 비범위
- Selenium 제거
- 전체 소스의 일괄 Playwright 이전
- DB write 직접 적재 완성

## 초기 구조
- `src/cli/`
  실행 진입점
- `src/core/`
  브라우저, 키워드 해석, 파일 출력 유틸
- `src/sources/emart.ts`
  Emart 검색 수집, `__NEXT_DATA__` 파싱, 점수 계산
- `src/sources/lotteon.ts`
  Lotteon script 파싱 우선 + DOM fallback 검색 수집

## 운영 원칙
- 쇼핑몰별 차이는 source 모듈에 가둔다.
- 결과를 DB에 쓰기 전에도 dry-run JSON과 debug artifact를 남겨 관찰 가능하게 한다.
- Selenium 런타임과 Playwright 런타임은 당분간 공존하며, Playwright가 안정화되기 전까지 기존 write path를 대체하지 않는다.

## Ingest Preview
- Playwright 결과를 바로 DB에 쓰지 않고, Supabase REST 조회를 통해 `liquor_info` 매칭과 `liquor`/`liquor_price`/`liquor_url` 처리 계획을 계산한다.
- preview는 `reuse` / `insert` / `update` / `skip` 결정을 JSON 아티팩트로 남기며 실제 write는 수행하지 않는다.
- preview 런타임은 `backend/crawler-playwright/.env`, `backend/.env`, `frontend/.env.local` 순서로 서버 전용 Supabase 자격증명을 탐색한다.
- preview 산출물에는 `confidence`, `reviewNeeded`, `blockReason`, `autoWriteAllowed` 안전장치 레이어를 함께 저장해, 저점수/기존 후보 충돌/소스별 신규 insert 같은 위험 조건을 먼저 차단한다.

## Ingest Write Path
- `ingest:*` CLI는 `preview + safety gate`를 먼저 수행한 뒤 `autoWriteAllowed=true`인 경우만 실제 upsert를 수행한다.
- upsert 대상은 현재 Java crawler write path와 동일하게 `liquor`, `liquor_price`, `liquor_url`이다.
- 차단된 건은 DB를 변경하지 않고 write artifact에 `blocked=true`, `blockReason`, `details[]`만 남긴다.

## Lotteon Batch Operations
- `preview:lotteon:batch`, `ingest:lotteon:batch`는 `liquor_info` 전체를 기준으로 keyword를 생성해 일괄 실행한다.
- batch 실행은 raw artifact 외에 `artifacts/summaries/*.json`, `*.md` 요약 리포트를 남긴다.
- 현재 검증 기준으로 22개 keyword 중 13개가 자동 적재 허용, 9개가 review/차단 대상으로 분류됐다.
