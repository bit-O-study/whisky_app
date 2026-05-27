# 024.vercel-seo-domain-migration / progress

- 2026-05-27 14:15 KST: `frontend/app/layout.tsx`, `frontend/app/robots.ts`, `frontend/app/sitemap.ts`에 이전 Vercel 도메인 하드코딩이 있음을 확인했다.
- 2026-05-27 14:15 KST: 새 대표 도메인은 코드 고정값 대신 환경변수 기반으로 결정하고, 미설정 시 기존 Vercel URL로 fallback하기로 했다.
- 2026-05-27 14:16 KST: `getSiteUrl`/`normalizeSiteUrl` 공용 설정 모듈을 추가하고 `metadataBase`, robots sitemap URL, sitemap root URL이 같은 대표 URL을 쓰도록 변경했다.
- 2026-05-27 14:16 KST: `npm run test` 통과. 5개 테스트 파일, 20개 테스트가 통과했다.
- 2026-05-27 14:17 KST: `npm run lint` 완료. 에러는 없고 기존 `CatalogPageClient.tsx` hook dependency 경고 1개가 남아 있다.
- 2026-05-27 14:17 KST: `npm run build` 통과. Next.js 프로덕션 빌드와 `/robots.txt`, `/sitemap.xml` route 생성을 확인했다.
- 2026-05-27 14:18 KST: 대표 URL 우선순위 테스트를 추가하고 `npm run test -- src/shared/config/__tests__/site-url.test.ts` 통과를 확인했다. 4개 테스트가 통과했다.
