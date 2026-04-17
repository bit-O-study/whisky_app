# 018.improve-catalog-fonts / progress

- 2026-04-16 15:47: `docs/DESIGN.md`, `docs/FRONTEND.md`, `docs/product-specs/catalog-browse-and-search.md`, `docs/design-docs/atmospheric-sommelier.md`를 확인해 에디토리얼형 카탈로그 톤과 Typography 원칙을 다시 확인했다.
- 2026-04-16 15:48: `frontend/app/globals.css`의 현재 폰트가 시스템 fallback 중심(`Iowan Old Style`, `Avenir Next`)이라 한글/영문 혼합 화면에서 톤이 약하다는 점을 확인했다.
- 2026-04-16 15:51: `next/font/google` 기반으로 `Newsreader` + `Manrope` + `Noto Serif KR` + `Noto Sans KR` 조합을 적용해 영문 에디토리얼 톤과 한글 가독성을 함께 개선했다.
- 2026-04-16 15:53: `frontend/app/globals.css`에서 전역 폰트 토큰을 새 웹폰트 변수 기준으로 바꾸고, 폰트 스무딩/legibility 설정을 추가했다.
- 2026-04-16 15:56: `npm run lint`, `npm run build`를 실행해 통과를 확인했다.
- 2026-04-16 15:58: 새 빌드로 `next start --port 3000 --hostname 0.0.0.0`를 다시 띄워 실제 화면을 확인했고, 스크린샷(`/tmp/whiskydamoa-font-refresh.png`)으로 헤더/카드 타이포그래피 개선을 검증했다.
