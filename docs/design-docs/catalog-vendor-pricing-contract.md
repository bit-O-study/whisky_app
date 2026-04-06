# Catalog Vendor Pricing Contract

## 배경
- DB 구조는 "중복 상품 여러 행"보다 "주류 1건 + 판매처별 가격 목록"에 가깝게 정리되었다.
- 프론트가 `name` 기준 재그룹핑을 계속하면 실제 데이터 구조와 표시가 어긋난다.

## 현재 계약
- 카탈로그 카드 1장은 하나의 `liquor` 엔티티를 나타낸다.
- 가격 정보는 `vendors[]`로 내린다.
- `vendors[]`에는 판매처별 최신 가격과 링크가 들어간다.
- 카드의 `lowest_price`는 `vendors[]` 기준으로 계산한다.

## 구현 원칙
- 서버 계층에서 집계해 내려주고, 프론트는 이를 직접 소비한다.
- 프론트의 임시 재그룹핑 로직은 두지 않는다.
- 상세 페이지도 같은 가격 집계 원칙을 사용한다.

## 관련 문서
- [009 liquor detail spec](/home/ubuntu/code/bitO-liquor/docs/product-specs/liquor-detail-page.md)
- [008 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/008.catalog-deduped-vendor-pricing-sync/brief.md)
