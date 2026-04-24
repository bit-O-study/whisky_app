# 035.crawler-enriched-metadata / brief

## 배경
- Playwright crawler가 상품/가격은 수집하지만, 사용자가 블렌디드/싱글몰트/버번 같은 분류 정보도 함께 활용하고 싶어 한다.
- 해당 분류는 쇼핑몰 상세에서 불안정하게 긁기보다 `liquor_info.sub_category`를 매칭 결과로 붙이는 편이 안정적이다.

## 목표
- ingest preview artifact에 매칭된 `liquor_info` 메타데이터(`sub_category` 포함)를 포함한다.
- 카탈로그 API 응답에 `sub_category`, vendor `discount_percent`, `crawled_at`을 포함한다.
- 카드/상세 화면에서 sub category를 표시한다.

## 비목표
- DB 스키마 변경
- 쇼핑몰 상세 페이지 추가 크롤링
- 추천/필터 기능 추가

## 성공 기준
- Playwright crawler build가 통과한다.
- frontend lint/test/build 중 가능한 검증이 통과한다.
- 카탈로그 목록/상세 응답 모델에서 sub category를 사용할 수 있다.
