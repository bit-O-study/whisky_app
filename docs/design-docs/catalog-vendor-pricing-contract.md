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
- 저장할 현재 가격은 양의 정수여야 한다. 가격 파싱 실패 시 기존 가격을 덮어쓰지 않는다.
- 확인 시각은 저장한 가격 관측 시각이며 이력과 함께 갱신한다.
- Playwright는 기존 마스터에 대한 `ingest_existing_liquor(jsonb)` RPC로 가격·링크·이력을 원자적으로 저장한다. 호출 권한은 service_role만 갖는다. 함수 미설치는 명시적 오류이며 개별 REST 쓰기로 우회하지 않는다.
- 서버 계층에서 집계해 내려주고, 프론트는 이를 직접 소비한다.
- 프론트의 임시 재그룹핑 로직은 두지 않는다.
- 판매처 링크는 카드와 오버레이에서 같은 가격 집계 결과를 사용한다.

## 관련 문서
- [008 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/008.catalog-deduped-vendor-pricing-sync/brief.md)
