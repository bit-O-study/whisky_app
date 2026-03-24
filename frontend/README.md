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
