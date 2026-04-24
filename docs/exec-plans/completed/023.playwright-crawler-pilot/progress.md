# 023.playwright-crawler-pilot / progress

- 2026-04-24 13:35: `CONSTITUTION.md`, `docs/REPOSITORY.md`, `docs/CHANGE_POLICY.md`, `docs/PLANS.md`, `ARCHITECTURE.md`, `docs/ENVIRONMENTS.md`, `docs/REPO_MAP.md`, `backend/AGENTS.md`를 확인하고, 이번 작업을 crawler/write path + repo docs 변경으로 분류했다.
- 2026-04-24 13:42: Selenium 제거는 제외하고 `backend/crawler-playwright`를 별도 Node + Playwright 파일럿 런타임으로 추가하기로 범위를 확정했다.
- 2026-04-24 13:58: `backend/crawler-playwright` 스캐폴드, Emart dry-run CLI, Playwright 파일럿 design doc/README 반영 초안을 추가했다.
- 2026-04-24 13:59: `npm install`, `npm run install:browsers`로 Playwright 런타임 의존성과 Chromium 바이너리 설치를 완료했다.
- 2026-04-24 14:01: `npm run build` 중 `src/core/keywords.ts`의 개행 regex 깨짐을 수정한 뒤 TypeScript 빌드 통과를 확인했다.
- 2026-04-24 14:05: `npm run crawl:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`을 실행해 이마트에서 `[위스키] 산토리 가쿠빈 700ml`를 점수 179, 가격 39,800원으로 수집했고 결과 파일 `backend/crawler-playwright/artifacts/results/emart-2026-04-24T04-45-38-366Z.json` 생성을 확인했다.
- 2026-04-24 14:06: `bash scripts/verify-repo.sh`를 실행해 exec plan 구조와 Markdown 링크 검증이 모두 통과했다.
