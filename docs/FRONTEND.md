# FRONTEND

## 구조
```txt
frontend/src/
  entities/
  features/
  shared/
  lib/
```

## 규칙
- 카탈로그는 `features/catalog`를 중심으로 확장한다.
- 도메인 모델과 DTO는 분리한다.
- UI는 화면 렌더링과 입력 처리에 집중한다.
- 조회 규칙, 조합 규칙, 오류 처리 규칙은 feature/model에 둔다.
- 서버 조회와 클라이언트 후속 조회는 가능한 한 같은 모델을 공유한다.
- `shared/`는 목표 공용 경계다.
- 현재 저장소에는 일부 공통 코드가 `lib/`에 남아 있으므로, 새 공용 모듈은 특별한 이유가 없으면 `shared/` 또는 팀이 합의한 공용 경계에 두고 기존 `lib/`는 점진적으로 정리한다.

## 검증
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

## 상세 문서
- [frontend-clean-architecture.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/frontend-clean-architecture.md)
