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
- Browser runtime
  사용자 상호작용, 내부 API 호출만 담당
- Next.js server runtime
  Supabase 조회, 응답 매핑, 서버 전용 키 사용
- crawler runtime
  외부 사이트 수집과 DB write
- backend/api runtime
  보조 운영 기능

## Deployment Notes
- Next.js는 현재 Vercel 배포를 전제로 한 메타데이터와 계측 설정이 일부 반영돼 있다.
- crawler와 backend/api는 로컬/서버 환경에서 별도 프로세스로 실행된다.

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
- Supabase MCP 토큰은 파일에 평문으로 두지 않고 환경변수로 주입한다.
- MCP가 실제 저장소 DB와 다른 프로젝트를 가리킬 수 있으므로, 고위험 변경은 문서와 실제 접속 대상을 대조해야 한다.

## Drift Risks
- 문서상 스키마와 실제 DB 스키마의 드리프트
- MCP 설정 프로젝트와 실제 작업 대상 프로젝트의 불일치
- 로컬 build/test 환경과 샌드박스 환경 차이
