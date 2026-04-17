# Supabase Data Model Draft

## 기준
- 이 초안은 `backend/common`의 JPA 엔티티와 현재 Next.js 조회 코드 기준으로 작성한다.
- 실제 Supabase MCP 프로젝트는 현재 저장소와 다른 프로젝트로 연결되어 있으므로, 이 문서는 로컬 설계 원본으로만 사용한다.

## 핵심 테이블
- `public.liquor`
  목록 조회와 검색의 기준 엔티티다.
  `normalized_name`, `brand`, `category`, `volume_ml`, `alcohol_percent`, `country`, `product_code`, `product_name`, `product_url`, `image_url`, flavor profile 컬럼, `created_at`, `updated_at`를 포함한다.
- `public.liquor_price`
  판매처별 가격 이력을 보관한다.
  `liquor_id + source`를 유니크 키로 두고, 최신 `crawled_at` 기준 가격을 우선 사용한다.
- `public.liquor_info`
  크롤러가 매칭에 사용하는 보조 기준 테이블이다.
  `brand`, `category`, `alcohol_percent`, `volume_ml`, `clazz` 조합을 기반으로 매칭한다.

## 조회 규격
- 목록 기본 정렬은 `liquor.updated_at desc`다.
- 검색 조건은 `product_name`, `normalized_name`, `brand`에 대한 대소문자 무시 부분 검색이다.
- 가격은 `liquor_price`에서 동일 `liquor_id`의 최신 `crawled_at` 레코드를 우선 사용한다.
- 현재 카탈로그 계약은 `liquor`와 `liquor_price`를 조합해 주류 1건당 `vendors[]`를 구성하는 방식이다.
- `liquor_catalog_latest_price` 뷰는 주류당 최신 가격 1건만 반환하므로, 현재 멀티벤더 카탈로그의 기본 조회 모델로 사용하지 않는다.
- 필요하다면 검색 최적화나 단일 최신가 surface 용도의 보조 읽기 모델로만 제한해 사용한다.

## 인덱스 방향
- 목록 페이징용 `liquor.updated_at desc` 인덱스
- 검색용 trigram GIN 인덱스
  `lower(product_name)`, `lower(normalized_name)`, `lower(brand)`
- 가격 최신 조회용 `(liquor_id, crawled_at desc)` 인덱스
- 크롤러 매칭용 `liquor_info(brand, category, volume_ml)` 인덱스

## 적재 경로
- `backend/crawler`는 중간 적재 API 없이 Supabase가 연결된 Postgres에 JPA로 직접 적재한다.
- `LiquorRepository`, `LiquorPriceRepository`, `LiquorInfoRepository`를 그대로 사용하고, DB 연결 대상만 Supabase Postgres로 맞춘다.
- 크롤러는 `liquor` upsert 후 `liquor_price`를 `(liquor_id, source)` 기준으로 upsert한다.

## 읽기/쓰기 모델
- 브라우저는 Supabase 테이블에 직접 접근하지 않는다.
- Next.js 서버 라우트가 서버 측 자격증명으로 조회를 수행한다.
- 크롤러는 서버 측 DB 자격증명으로 쓰기를 수행한다.
- 따라서 초기 단계에서는 익명 클라이언트에 대한 테이블 직접 공개 정책을 열지 않는 것이 기본값이다.

## 남은 항목
- Supabase Storage 공개 범위와 기본 이미지 정책
- 실제 Supabase 프로젝트에 반영할 마이그레이션 파일 위치
- 멀티벤더 카탈로그 계약을 유지한 채 `liquor_catalog_latest_price` 같은 보조 읽기 모델을 어디까지 병행할지 결정
