# DESIGN

## 현재 방향
- 2026-10-15 사용자가 선택한 C안: 화이트/블루 기반의 빠른 가격 비교 목록.
- PC는 왼쪽 필터와 상품 행, 모바일은 가로 필터와 간결한 상품 행을 사용한다.
- 작은 상품 사진, 큰 최저가, 용량/도수와 펼침 판매처 표로 비교한다. 폰트는 시스템 글꼴을 사용한다.

## 실무 원칙
- 옅은 구분선과 일정한 행 간격으로 상품을 빠르게 비교할 수 있게 한다.
- 디자인 실험은 검색/목록/판매처 비교 기능 회귀를 만들면 안 된다.
- 카드, 오버레이, 헤더는 데스크톱과 모바일 상호작용 차이를 인정하고 설계한다.
- 작은 polish는 전역 품질 개선에 흡수하고, 장기 디자인 원칙만 이 문서에 남긴다.

## 상세 설계
- 디자인 시스템 원본: [atmospheric-sommelier.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/atmospheric-sommelier.md)
- 카탈로그 UX 계약: [catalog-browse-and-search.md](/home/ubuntu/code/bitO-liquor/docs/product-specs/catalog-browse-and-search.md)
