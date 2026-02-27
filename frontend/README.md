# frontend

React 19 + TypeScript + Vite 기반 주류 가격 조회 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버 주소: `http://localhost:5173`

## 백엔드 연동

프론트는 아래 API를 사용합니다.

- `GET /api/liquors`
- `GET /api/liquors/search?q=...`

기본 API Base URL: `http://localhost:8080`

다른 주소를 쓰려면 `frontend/.env`에 설정하세요.

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## 스크립트

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```
