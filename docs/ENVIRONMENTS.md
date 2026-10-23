# ENVIRONMENTS

## 목적
- 로컬 실행, 배포, DB, MCP, 시크릿 경계를 repo 운영 관점으로 정리한다.

## Local Development
- frontend
  `frontend/.env.local` 사용
- backend
  `backend/.env` 사용
- 브라우저
  공개 가능한 키만 사용
- 서버/크롤러
  서비스 키와 DB 자격증명 사용

## Runtime Boundaries
로컬 서버 키가 없으면 `frontend/.env.local`에 `SUPABASE_LOCAL_SNAPSHOT=logs/catalog-snapshot.json`을 지정해 실제 DB에서 가져온 사본으로 미리볼 수 있다. 사본은 `{ capturedAt, projectRef, tables: { liquor, liquor_price, liquor_price_history } }` JSON이며 상품의 `liquor_info`와 `liquor_url` 관계를 포함한다. 개발 모드에서만 적용되며 서버 키 설정 시 실시간 연결을 우선한다. 갱신하려면 연결된 Supabase 도구로 사본을 다시 가져온다.

- Browser runtime
  사용자 상호작용, 내부 API 호출만 담당
- Next.js server runtime
  Supabase 조회, 응답 매핑, 서버 전용 키 사용
- crawler runtime
  외부 사이트 수집과 DB write
- crawler-playwright runtime
  Node + Playwright 기반 별도 운영 크롤러/배치 실행 경로
- backend/api runtime
  보조 운영 기능

## Deployment Notes
- 롯데온 일일 작업: `.github/workflows/lotteon-daily.yml`, 매일 09:00 KST. Playwright → GitHub OIDC → 운영 Next.js 내부 적재 API → 서버 전용 RPC. GitHub에 DB 시크릿을 추가하지 않는다. 웹서버의 기존 Supabase 서버 키를 사용한다. 기본 브랜치 반영·운영 배포·첫 수동 실행 성공으로 활성화를 확인한다.
- Playwright 원자적 저장 RPC: `backend/crawler-playwright/sql/ingest_existing_liquor.sql`. 서버 역할만 실행할 수 있으며 2026-10-23 사용자 승인 후 운영 DB에 반영했다.
- Next.js는 현재 Vercel 배포를 전제로 한 메타데이터와 계측 설정이 일부 반영돼 있다.
- crawler와 backend/api는 로컬/서버 환경에서 별도 프로세스로 실행된다.
- `backend/crawler-playwright`는 HTTP 서버가 아니라 별도 Node 프로세스/배치로 실행하는 것을 기본 전제로 둔다.

## Secret Handling
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  백엔드/크롤러 DB 연결
- `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_KEY`
  Next.js 서버 조회
- `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`
  업로드/스토리지 연계 시 사용
- `NEXT_PUBLIC_*`
  공개 가능한 값만 사용

## MCP / Tooling
- 로컬 MCP 설정은 `.mcp.json`을 기준으로 한다.
- `.mcp.json`에는 저장소 전용 `supabase`, `playwright` 엔트리를 둔다.
- Supabase MCP는 `bitO` 프로젝트 ref `jeqvxzkvumkiraclauvo`로 고정하고 기본값은 read-only로 둔다.
- Supabase MCP 토큰은 파일에 평문으로 두지 않고 환경변수 `SUPABASE_ACCESS_TOKEN`으로 주입한다.
- Playwright MCP는 headless + isolated 기본값과 `.playwright-mcp/` 출력 디렉터리를 사용한다.
- MCP가 실제 저장소 DB와 다른 프로젝트를 가리킬 수 있으므로, 고위험 변경은 문서와 실제 접속 대상을 대조해야 한다.

## Drift Risks
- 문서상 스키마와 실제 DB 스키마의 드리프트
- MCP 설정 프로젝트와 실제 작업 대상 프로젝트의 불일치
- 로컬 build/test 환경과 샌드박스 환경 차이
