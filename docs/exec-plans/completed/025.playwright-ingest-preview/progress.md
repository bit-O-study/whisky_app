# 025.playwright-ingest-preview / progress

- 2026-04-24 14:34: `docs/design-docs/supabase-data-model.md`, `backend/common` JPA model/repository, `backend/crawler` service 로직을 다시 확인해 preview가 `liquor_info` 매칭 → `liquor` 재사용/생성 판단 → `liquor_price`/`liquor_url` insert/update 판단 순서로 계산돼야 함을 정리했다.
- 2026-04-24 14:43: 새 의존성 없이 Supabase REST 조회를 사용하는 `src/core/supabase-rest.ts`, `src/core/ingest-preview.ts`와 `preview:emart`/`preview:lotteon` CLI를 추가했다.
- 2026-04-24 14:46: 첫 preview 실행이 환경변수 부재로 실패한 것을 확인하고, 런타임이 `backend/crawler-playwright/.env`, `backend/.env`, `frontend/.env.local`을 순서대로 자동 로드하도록 `src/core/env.ts`를 추가했다.
- 2026-04-24 14:48: `npm run preview:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1` 실행으로 `matchedLiquorInfoId=223`, `matchedLiquorId=871`, `liquorAction=reuse`, `priceAction=update`, `urlAction=update` 결과를 확인했고 `artifacts/previews/emart-preview-2026-04-24T05-01-23-955Z.json` 파일이 생성됐다.
- 2026-04-24 14:49: `npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 실행으로 `matchedLiquorInfoId=212`, `matchedLiquorId=null`, `liquorAction=insert`, `priceAction=insert`, `urlAction=insert` 결과를 확인했고 `artifacts/previews/lotteon-preview-2026-04-24T05-01-37-736Z.json` 파일이 생성됐다.
- 2026-04-24 14:50: `bash scripts/verify-repo.sh`를 실행해 exec plan 구조와 Markdown 링크 검증이 통과했다.
