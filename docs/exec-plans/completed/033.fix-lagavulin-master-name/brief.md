# 033.fix-lagavulin-master-name / brief

## 배경
- 현재 라가불린 16년 master liquor row의 `product_name`에 `[2개 30%]` 같은 프로모션 문구가 포함돼 있다.
- 이 값은 상품 정체성이 아니라 일시적인 판매 문구이므로 master canonical name으로 유지되면 안 된다.

## 목표
- 라가불린 16년 master row의 `product_name`을 canonical 이름으로 정리한다.
- 다른 필드나 관련 가격/URL은 건드리지 않는다.

## 비목표
- 전체 master data 정리
- 다른 상품명 정규화 일괄 적용
- crawler 로직 수정

## 성공 기준
- 대상 liquor row 조회 시 `product_name`이 `라가불린 16년 (700ML)`로 바뀌어 있다.
