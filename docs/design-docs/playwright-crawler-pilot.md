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
