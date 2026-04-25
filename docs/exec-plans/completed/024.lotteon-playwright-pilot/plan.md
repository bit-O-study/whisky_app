# 024.lotteon-playwright-pilot / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- Emart 파일럿과 같은 구조를 유지하면서 Lotteon source/CLI만 추가한다.
- 수집은 `data-item` script 파싱을 우선 사용하고, 점수 기준 미달 시 DOM 카드 fallback을 사용한다.
- DB write는 붙이지 않고 결과 JSON/debug HTML만 남긴다.

## 작업 단계
- [x] Phase 1. 현재 Lotteon Selenium 로직 분석
- [x] Phase 2. Playwright source/CLI 구현
- [x] Phase 3. 문서 반영과 검증

## 검증
- `cd backend/crawler-playwright && npm run build`
- `cd backend/crawler-playwright && npm run crawl:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1`
- `bash scripts/verify-repo.sh`

## 리스크
- Lotteon `data-item` 속성 구조가 바뀌면 script 파싱이 바로 깨질 수 있다.
- DOM fallback은 현재 클래스명 변화에 취약할 수 있다.
