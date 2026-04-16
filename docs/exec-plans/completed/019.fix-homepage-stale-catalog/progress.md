# 019.fix-homepage-stale-catalog / progress

- 2026-04-16 16:06: `ARCHITECTURE.md`, `docs/design-docs/nextjs-supabase-migration.md`, `frontend/app/page.tsx`, `frontend/src/features/catalog/api/catalog-server.ts`를 확인해 홈 첫 화면이 Next.js 서버 계층에서 Supabase를 읽는 구조임을 재확인했다.
- 2026-04-16 16:08: 실제 라이브 검증 결과, 홈 카드 상위 5개(`제임슨`, `짐빔화이트`, `산토리 가쿠빈`...)와 `/api/liquors` 상위 5개(`더 글렌드로낙 12년`, `벨즈`, `제임슨`...)가 달랐고, 원인은 홈 페이지가 빌드 시점 정적 생성(`○ /`) 상태라 초기 데이터가 오래된 값으로 고정된 데 있음을 확인했다.
- 2026-04-16 16:12: `frontend/app/page.tsx`에 `export const dynamic = "force-dynamic";`를 추가해 홈 화면이 빌드 시점 정적 데이터 대신 요청 시점 최신 서버 데이터를 사용하도록 변경했다.
- 2026-04-16 16:16: `npm run lint`, `npm run build`를 실행해 통과를 확인했고, 빌드 결과에서 홈 라우트가 `ƒ /`로 바뀐 것을 확인했다.
- 2026-04-16 16:18: 3000번 서버를 재시작한 뒤 홈 상위 5개와 `/api/liquors` 상위 5개를 비교해 둘 다 `더 글렌드로낙 12년`, `벨즈`, `제임슨`, `버팔로트레이스`, `짐빔화이트` 순으로 일치함을 확인했다.
