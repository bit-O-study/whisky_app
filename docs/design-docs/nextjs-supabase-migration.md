# Next.js + Supabase Migration

## 결정
- 카탈로그의 주 조회 경로를 Spring API 중심 구조에서 Next.js + Supabase 중심 구조로 전환한다.
- Spring 백엔드는 크롤링과 적재 역할에 더 집중한다.

## 이유
- 조회 API와 크롤링 파이프라인이 한 문맥에 섞이면 책임이 흐려진다.
- 화면 개발과 조회 규칙 수정 속도를 높이려면 UI와 읽기 모델의 거리를 줄이는 편이 낫다.
- 추천 제거 이후 현재 제품의 핵심은 카탈로그 조회와 상세 탐색이다.

## 목표 상태
- 브라우저는 Spring 조회 API에 직접 의존하지 않는다.
- Next.js 서버 계층이 Supabase를 조회한다.
- `backend/crawler`는 적재 파이프라인을 담당한다.
- `backend/api`는 보조 운영성 기능 위주로 남는다.

## 후속 영향
- 프론트 구조 규칙은 [frontend-clean-architecture.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/frontend-clean-architecture.md)에서 관리한다.
- 데이터 모델 원본은 [supabase-data-model.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/supabase-data-model.md)와 [db-schema.md](/home/ubuntu/code/bitO-liquor/docs/generated/db-schema.md)로 나눈다.
- 실행 기록은 [001 migration archive](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/001.nextjs-supabase-migration/brief.md)에 보관한다.
