# SECURITY

## 비밀값 원칙
- 비밀값은 저장소에 커밋하지 않는다.
- 브라우저 노출 변수에는 공개 가능한 키만 둔다.
- `sb_secret_...` 계열 키는 서버 전용 환경변수로만 사용한다.

## 현재 환경변수
- 백엔드 DB
  `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- 백엔드 업로드/스토리지
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET`
- 프론트 서버 조회
  `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_KEY`
- 프론트 공개 키
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 publishable key
  현재 기본 카탈로그 조회 경로에는 필수가 아니며, 공개 클라이언트 연동이 필요할 때만 사용한다.

## 경계
- 브라우저는 기본적으로 테이블 직접 접근을 전제로 설계하지 않는다.
- Next.js 서버 계층이 서버 자격증명으로 조회한다.
- 크롤러는 서버 자격증명으로 쓰기를 수행한다.

## 일일 롯데온 적재 인증
- POST /api/internal/lotteon-ingest는 GitHub OIDC RS256 JWT만 받는다. issuer는 token.actions.githubusercontent.com, audience는 운영 적재 URL이다. 토큰 발급 후 5분 이내이며 exp/nbf를 검증한다.
- repository_id=1249660635, bit-O-study/whisky_app, refs/heads/main, 정확한 lotteon-daily.yml workflow_ref 및 schedule/workflow_dispatch만 허용한다.
- 서버는 LOTTEON 기존 URL의 상품 코드와 입력 URL을 대조하고 양수 정수 가격과 관측 시각을 검증한다. 기존 상품만 저장한다.
- DB 서버 키는 Next.js 안에 남으며 GitHub Actions에는 단기 OIDC 증명만 제공한다. RPC는 SECURITY INVOKER이고 anon/authenticated/PUBLIC 실행 권한이 없다.

## 임시 PC 실행기
- whisky-lotteon 전용 라벨만 등록하고 기본 self-hosted/Windows/X64 라벨은 제거한다. 공식 pre-job hook을 체크아웃 밖에 설치해 기존 OIDC와 같은 저장소/main/워크플로/이벤트 및 crawl job만 실행 전에 허용한다.
- 실행기 파일과 자격증명은 저장소 밖 전용 폴더에 두며 현재 사용자와 SYSTEM만 접근하도록 설정한다. 구성에 사용한 GitHub CLI 토큰은 실행기 프로세스에 상속하지 않는다.
- PR 검증은 GitHub 기본 서버에서 수행한다. 실행기 설치·자동 시작은 2026-10-23 사용자 승인에 따른 임시 운영이다.
