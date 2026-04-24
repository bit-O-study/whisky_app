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
