# 035.crawler-enriched-metadata / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- `liquor_info` 매칭 결과를 crawler preview에 명시적으로 싣는다.
- frontend는 `liquor_info` join으로 `sub_category`를 읽고, vendor 가격 정보에서 할인율/수집시각을 계산한다.
- 화면 표시는 기존 레이아웃을 크게 바꾸지 않고 메타 라인에 추가한다.

## 작업 단계
- [x] Phase 1. crawler ingest preview metadata 확장
- [x] Phase 2. frontend catalog model/API/UI 확장
- [x] Phase 3. 검증과 문서 정리

## 검증
- `cd backend/crawler-playwright && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
- `bash scripts/verify-repo.sh`

## 리스크
- Supabase 관계명(`fk_liquor_info`)이 환경마다 다르면 list/detail join이 실패할 수 있다.
