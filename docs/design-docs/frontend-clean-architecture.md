# Frontend Clean Architecture

## 목표
- 카탈로그 기능을 시작점으로 UI, 조회 규칙, 데이터 접근 책임을 분리한다.
- 구조는 교과서식 풀 레이어보다 얇고 실용적인 형태를 유지한다.

## 기준 구조
```txt
frontend/src/
  entities/
    liquor/
      api/
      model/
  features/
    catalog/
      api/
      model/
      ui/
  shared/
```

## 규칙
- `entities`
  도메인 모델, DTO, mapper 같은 엔티티 단위 규칙만 둔다.
- `features`
  검색, 페이지네이션, 그룹핑, 오류 메시지, 화면 조합 규칙을 둔다.
- `shared`
  프레임워크/인프라 공통 모듈만 둔다.
- UI는 repository나 Supabase shape를 직접 알지 않는다.
- 서버 선조회와 클라이언트 후속 조회는 같은 feature model을 공유한다.

## 의존 방향
- `ui -> feature model/api -> entity/shared`
- 역의존은 허용하지 않는다.

## 검증 기준
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

## 관련 기록
- [003 archive brief](/home/ubuntu/code/bitO-liquor/docs/exec-plans/completed/003.frontend-clean-architecture/brief.md)
- [docs/FRONTEND.md](/home/ubuntu/code/bitO-liquor/docs/FRONTEND.md)
