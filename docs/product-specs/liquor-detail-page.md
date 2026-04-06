# Liquor Detail Page

## 목표
- 카탈로그 카드에서 내부 상세 화면으로 자연스럽게 진입할 수 있어야 한다.
- 판매처 외부 링크와 상세 진입이 충돌하지 않아야 한다.

## 현재 제품 계약
- 상세 라우트는 Next.js App Router 기준으로 제공한다.
- 상세 화면은 최소한 상품명, 브랜드, 카테고리, 국가, 도수, 용량, 이미지, 판매처별 가격을 보여준다.
- 상세 조회는 카탈로그와 같은 데이터 계약을 사용한다.

## 상호작용 기준
- 데스크톱에서는 카드 오버레이의 빈 영역을 통해 상세로 들어갈 수 있다.
- 판매처 링크는 계속 외부 링크로 동작한다.
- 모바일에서는 상세 진입 버튼이 명시적으로 보여야 한다.

## 비범위
- 가격 히스토리 차트
- 리뷰
- 복잡한 추천 알고리즘

## 관련 문서
- [docs/design-docs/catalog-vendor-pricing-contract.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/catalog-vendor-pricing-contract.md)
- [009 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/009.liquor-detail-overlay-navigation/brief.md)
