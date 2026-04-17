# Frontend Guidelines

## 목적
- `frontend/`는 Next.js App Router 기반 카탈로그 읽기 경로의 중심입니다.
- 브라우저는 서버 전용 경계를 직접 넘지 않고, Next.js 서버 계층 또는 내부 API route를 통해 읽기 모델을 구성합니다.

## 구조
```txt
frontend/
  app/        # App Router 엔트리, layout, page, metadata
  public/     # 정적 자산
  src/
    entities/ # 도메인 엔티티와 DTO/mapper/api
    features/ # 카탈로그 기능 단위 조합
    shared/   # 목표 공용 경계
    lib/      # 레거시 공용 코드, 점진적 정리 대상
  tests/      # Playwright E2E
```

## 작업 규칙
- 카탈로그 기능 확장은 `src/features/catalog`를 중심으로 진행합니다.
- 도메인 모델과 외부 응답 DTO는 분리합니다.
- UI는 렌더링과 입력 처리에 집중하고, 매핑/오케스트레이션/에러 정규화는 UI 밖에 둡니다.
- 새 공용 모듈은 특별한 이유가 없으면 `src/shared`에 두고, `src/lib`는 레거시 정리 맥락에서만 수정합니다.
- 서버 전용 로직은 브라우저에서 직접 import 하지 않습니다. 브라우저는 내부 API 또는 서버 컴포넌트 경계를 거칩니다.
- 데이터 계약 변경은 코드보다 먼저 `ARCHITECTURE.md`와 관련 `docs/design-docs/*.md`, 필요 시 `docs/product-specs/*.md`에 반영합니다.

## 빌드, 테스트, 개발 명령어
- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run lint`: ESLint 실행
- `npm run test`: Vitest 단위 테스트 실행
- `npm run test:e2e`: Playwright E2E 실행

## 테스트 가이드
- 단위 테스트는 `src/**/__tests__/*.test.ts` 또는 관련 테스트 파일 패턴을 사용합니다.
- E2E 테스트는 `tests/*.spec.ts`에 둡니다.
- UI 흐름 변경은 가능하면 `lint -> build -> test -> test:e2e` 순으로 검증합니다.

## 참고 문서
- `docs/FRONTEND.md`
- `ARCHITECTURE.md`
- `docs/product-specs/catalog-browse-and-search.md`
- `docs/design-docs/frontend-clean-architecture.md`
