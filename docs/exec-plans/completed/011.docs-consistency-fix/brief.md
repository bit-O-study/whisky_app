# Brief

## 문제
- 상위 운영 문서와 설계 문서 일부가 현재 저장소 상태와 어긋난다.
- 특히 프론트 실행 명령, Supabase 서버 키 요구사항, `liquor_catalog_latest_price` 뷰의 현재 역할, `shared/` 구조 설명이 서로 다른 해석을 허용한다.

## 목표
- 현재 코드 기준으로 문서 서술을 정렬한다.
- 다음 작업자가 잘못된 실행 경로나 데이터 계약을 추론하지 않도록 모순을 줄인다.

## 비목표
- 제품 기능이나 코드 구조를 다시 바꾸지 않는다.
- 완료 아카이브의 역사 기록 전체를 재작성하지 않는다.

## 성공 기준
- `AGENTS.md`, `README.md`, `docs/SECURITY.md`, `docs/FRONTEND.md`, 관련 설계 문서가 현재 코드와 일치한다.
- `liquor_catalog_latest_price`가 현재 카탈로그 기본 계약이 아니라는 점이 문서상 명확하다.
- `shared/`가 목표 경계이고 일부 공통 코드가 아직 `lib/`에 남아 있다는 점이 문서상 명확하다.

## 관련 문서
- [AGENTS.md](/home/ubuntu/code/bitO-liquor/AGENTS.md)
- [README.md](/home/ubuntu/code/bitO-liquor/README.md)
- [ARCHITECTURE.md](/home/ubuntu/code/bitO-liquor/ARCHITECTURE.md)
