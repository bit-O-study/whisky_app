# 024.vercel-seo-domain-migration / brief

## 문제
- Vercel 이전 이후 프론트 SEO 메타데이터, robots, sitemap에 이전 배포 도메인 `https://bit-o-liquor.vercel.app`가 하드코딩되어 있다.
- 도메인 변경 때마다 코드 수정이 필요하고, canonical/sitemap이 새 대표 도메인과 어긋날 수 있다.

## 목표
- 사이트 대표 URL을 환경변수 기반으로 한 곳에서 결정한다.
- `metadataBase`, robots sitemap URL, sitemap root URL이 같은 대표 URL을 사용한다.
- 환경변수가 없는 배포에서도 현재 대표 Vercel 주소 `https://whisky-app-vert.vercel.app`를 fallback으로 사용한다.

## 비목표
- Google Search Console, Vercel Dashboard, DNS 같은 외부 서비스 설정은 저장소에서 직접 변경하지 않는다.
- 제품 상세 페이지별 동적 sitemap 확장은 이번 범위에 포함하지 않는다.

## 성공 기준
- 이전 도메인 하드코딩이 프론트 SEO 코드에서 제거된다.
- 대표 URL 정규화 규칙이 테스트로 고정된다.
- 프론트 lint, 단위 테스트, 빌드가 통과한다.

## 관련 문서
- `CONSTITUTION.md`
- `docs/FRONTEND.md`
- `frontend/AGENTS.md`
