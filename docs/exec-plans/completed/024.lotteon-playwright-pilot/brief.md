# 024.lotteon-playwright-pilot / brief

## 배경
- `backend/crawler-playwright`에 Emart dry-run 파일럿은 추가됐지만, 실제 운영 범위를 넓히려면 두 번째 주요 소스인 Lotteon도 같은 런타임에서 검증할 필요가 있다.
- 사용자는 Selenium 제거 없이 Playwright 병행 경로를 확장하려고 하므로, 다음 단계 역시 별도 파일럿 CLI 형태가 적절하다.

## 목표
- `backend/crawler-playwright`에 Lotteon dry-run CLI를 추가한다.
- script 파싱 우선 + DOM fallback 방식으로 Lotteon 검색 결과를 Playwright에서 수집한다.
- 기존 Emart 파일럿과 동일한 아티팩트/문서 패턴을 유지한다.

## 비목표
- Selenium 제거
- Lotteon DB write 연결
- 모든 소스 공통 적재 파이프라인 완성

## 성공 기준
- `npm run crawl:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`가 동작한다.
- 결과 JSON이 `backend/crawler-playwright/artifacts/results/`에 생성된다.
- 관련 문서와 exec plan이 Lotteon 파일럿 범위를 설명한다.
