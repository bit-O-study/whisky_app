# 025.playwright-ingest-preview / brief

## 배경
- `backend/crawler-playwright`는 현재 Emart/Lotteon dry-run 수집까지는 가능하지만, 그 결과가 실제 DB write path에서 어떻게 처리될지는 아직 별도 계산 단계가 없다.
- 바로 DB upsert를 붙이면 매칭 오류나 중복 생성 위험을 관찰하기 어렵기 때문에, 쓰기 전에 적재 계획을 확인하는 ingest preview가 필요하다.

## 목표
- Playwright 수집 결과를 기준으로 `liquor_info` 매칭, `liquor` 재사용/생성 여부, `liquor_price`/`liquor_url` insert/update 계획을 계산하는 preview 기능을 추가한다.
- Emart/Lotteon 각각에 대해 crawl + preview CLI를 제공한다.
- preview 결과를 JSON artifact로 저장한다.

## 비목표
- 실제 DB write 수행
- Selenium 제거
- 공통 ingest/write 파이프라인 완성

## 성공 기준
- `npm run preview:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1` 실행 시 preview JSON이 생성된다.
- `npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 실행 시 preview JSON이 생성된다.
- preview 결과에 `matchedLiquorInfoId`, `matchedLiquorId`, `liquorAction`, `priceAction`, `urlAction`이 포함된다.
