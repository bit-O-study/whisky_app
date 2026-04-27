# 023.playwright-crawler-pilot / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- Selenium 제거는 범위에서 제외하고, 별도 Node + Playwright 패키지를 파일럿 런타임으로 추가한다.
- 첫 단계는 DB write 대신 Emart 검색 dry-run과 결과 아티팩트 저장까지를 목표로 둔다.
- 장기 가치가 있는 런타임 경계와 사용법은 design doc/README에 승격한다.

## 작업 단계
- [x] Phase 1. 조사와 범위 확정
- [x] Phase 2. `backend/crawler-playwright` 스캐폴드와 Emart CLI 구현
- [x] Phase 3. 문서 반영과 검증

## 검증
- `cd backend/crawler-playwright && npm install`
- `cd backend/crawler-playwright && npm run install:browsers`
- `cd backend/crawler-playwright && npm run build`
- `cd backend/crawler-playwright && npm run crawl:emart -- --keyword "산토리 가쿠빈 700ml" --limit 1`
- `bash scripts/verify-repo.sh`

## 리스크
- 이마트가 `__NEXT_DATA__` 구조를 바꾸면 파일럿 파서가 깨질 수 있다.
- Playwright 브라우저 바이너리 설치가 필요하므로 초기 셋업 비용이 Selenium보다 커질 수 있다.
- 아직 DB write가 연결되지 않아 운영 적재 런타임으로는 바로 대체할 수 없다.
