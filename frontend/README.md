# frontend

Next.js App Router + TypeScript 기반 주류 가격 조회 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버 주소: `http://localhost:3000`

## Supabase 연동

프론트는 Next.js 내부 API를 통해 Supabase를 조회합니다.

- `GET /api/liquors`
- `GET /api/liquors/search?q=...`

현재 구현 기준으로 Supabase 조회 자체는 서버에서만 실행됩니다.
다만 카탈로그 화면은 `use client` 컴포넌트가 내부 API(`/api/liquors`, `/api/liquors/search`)를 호출하는 구조이므로, "모든 API 호출이 서버 컴포넌트 내부에서만 실행된다"는 의미의 완전한 서버사이드 호출 구조는 아닙니다.

## Next API 작업 체크리스트

- 외부 API, Supabase, 서비스 키가 필요한 호출은 반드시 Route Handler, Server Component, Server Action 같은 서버 경계 안에 둡니다.
- `use client` 파일에서는 비밀값이 필요한 SDK나 `server-only` 모듈을 직접 import하지 않습니다.
- 클라이언트에서 호출이 필요하면 외부 서비스가 아니라 내부 API 또는 Server Action만 호출하는지 확인합니다.
- 새 `fetch`를 추가할 때는 호출 위치가 `use client`인지 먼저 확인하고, 클라이언트 코드라면 비밀값 노출 가능성이 없는지 점검합니다.
- 응답 매핑, 권한 검증, 에러 정규화가 필요하면 클라이언트가 아니라 서버 경계에서 처리합니다.
- 작업 마무리 전 `rg -n '"use client"|fetch\\(' frontend/app frontend/src`로 클라이언트 호출 지점을 다시 확인합니다.

로컬 환경 변수 예시:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`NEXT_PUBLIC_*`에는 공개 가능한 anon/publishable 키만 넣어야 합니다.
`sb_secret_...` 형태의 키는 브라우저에 노출되면 안 되므로 서버 전용 변수로만 사용합니다.

## 스크립트

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```
