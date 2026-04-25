# 029.insert-black-label-master / brief

## 배경
- Lotteon Playwright preview는 `조니워커 블랙 (700ML)`를 안정적으로 수집하지만, 기존 `liquor` 마스터가 없어 신규 insert 판단이 나오고 있다.
- 현재 DB에는 같은 브랜드/용량의 `블랙루비`, `블론드`만 있고, `조니워커 블랙 라벨` 기준 마스터가 없다.

## 목표
- `조니워커 블랙 라벨 700ml`를 위한 기준 `liquor` 마스터 row를 DB에 추가한다.
- 추가 후 Lotteon preview/ingest가 기존 마스터 재사용(`reuse`)으로 바뀌는지 확인한다.

## 비목표
- Selenium 제거
- 모든 조니워커 라인업 수동 보강
- Lotteon 정책 전체 완화

## 성공 기준
- DB에 `조니워커 블랙 라벨 700ml` master row가 추가된다.
- `npm run preview:lotteon -- --keyword "조니워커 블랙 라벨 700ml" --limit 1` 재실행 시 `matchedLiquorId`가 채워지고 `liquorAction`이 `reuse`가 된다.
