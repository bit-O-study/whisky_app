# 024.lotteon-playwright-pilot / progress

- 2026-04-24 14:12: `backend/crawler/src/main/java/org/bito/liquor/scraper/LotteonScraper.java`를 다시 확인해 script 파싱 우선 + DOM fallback + 키워드 점수 계산 구조를 Playwright 파일럿으로 옮기기로 했다.
- 2026-04-24 14:17: `src/sources/lotteon.ts`, `src/cli/run-lotteon.ts`, `package.json` 스크립트를 추가해 Lotteon dry-run CLI를 구현하고 README/design doc을 Lotteon 파일럿 범위까지 확장했다.
- 2026-04-24 14:20: `npm run build`를 통과했고 `npm run crawl:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 실행으로 `조니워커 블랙 (700ML)`를 가격 47,800원, 점수 48로 수집했다.
- 2026-04-24 14:21: `clazz`가 `블랙 ()`로 남는 후처리 결함을 수정해 `블랙`으로 정리했다.
- 2026-04-24 14:22: `bash scripts/verify-repo.sh`를 실행해 exec plan 구조와 Markdown 링크 검증이 통과했다.
