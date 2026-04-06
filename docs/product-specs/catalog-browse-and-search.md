# Catalog Browse And Search

## 사용자 문제
- 사용자는 주류를 빠르게 검색하고, 판매처별 가격을 비교하며, 긴 목록에서도 탐색 흐름을 잃지 않아야 한다.

## 현재 제품 계약
- 첫 페이지는 가능한 한 서버 선조회로 빠르게 보여준다.
- 검색은 부분 일치 기반으로 동작한다.
- 목록은 무한 스크롤로 이어진다.
- 카드에서는 판매처별 가격 비교를 바로 확인할 수 있어야 한다.
- 추천 기능은 현재 범위에 포함하지 않는다.

## 상호작용 기준
- 헤더의 브랜드 영역은 상단 복귀 진입점이다.
- 데스크톱에서는 카드 hover/focus-within 상호작용이 중요하다.
- 모바일에서는 명시적인 버튼/펼침 제어가 우선이다.
- 검색, 목록 조회, 추가 페이지 로딩은 서로 충돌하지 않아야 한다.

## 화면 품질 기준
- UI 리뉴얼이나 polish는 기능 회귀 없이 이 계약 위에서 이뤄져야 한다.
- 카탈로그는 브랜드 톤을 가지되, 가격 비교 가독성을 해치면 안 된다.

## 관련 문서
- [docs/DESIGN.md](/home/ubuntu/code/bitO-liquor/docs/DESIGN.md)
- [002 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/002.nextjs-ui-regression-recovery/brief.md)
- [005 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/005.header-logo-scroll-top/brief.md)
