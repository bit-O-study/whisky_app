# crawler-playwright

Node + Playwright 기반 파일럿 크롤러 런타임입니다.

## 현재 범위
- 기존 `backend/crawler` Selenium 런타임과 병행
- Emart/Lotteon 검색 결과 dry-run CLI 제공
- DB write 대신 결과 JSON/trace/debug HTML 아티팩트와 ingest preview 계획 저장
- preview 결과에는 `confidence`, `reviewNeeded`, `blockReason`, `autoWriteAllowed` 안전장치 판단이 포함됨

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
npm run crawl:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run ingest:lotteon -- --keyword "조니워커 블랙 라벨 700ml"
npm run crawl:emart -- --keywords-file ./keywords.txt --limit 5
```

## 출력
- `artifacts/results/*.json`
- `artifacts/previews/*.json`
- `artifacts/writes/*.json`
- `artifacts/debug/*.html`
- `artifacts/traces/*.zip` (`--trace` 사용 시)
