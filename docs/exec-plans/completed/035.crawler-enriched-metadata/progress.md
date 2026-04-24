# 035.crawler-enriched-metadata / progress

- 2026-04-24 16:??: 블렌디드/싱글몰트/버번 같은 분류는 쇼핑몰에서 새로 긁기보다 `liquor_info.sub_category`를 매칭 결과로 붙이기로 했다.
- 2026-04-24 16:12: crawler ingest preview에 `matchedLiquorInfo`를 추가해 `subCategory`를 artifact에 남기도록 했다.
- 2026-04-24 16:14: frontend catalog model/API에 `sub_category`, vendor `discount_percent`, `crawled_at`을 추가하고 카드/상세 메타 표시를 연결했다.
- 2026-04-24 16:15: `cd backend/crawler-playwright && npm run build`, `cd frontend && npm run lint`, `cd frontend && npm run test`, `cd frontend && npm run build`를 통과했다.
- 2026-04-24 16:16: `bash scripts/verify-repo.sh` 통과를 확인했다.
