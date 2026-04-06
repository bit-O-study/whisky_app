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
  현재 기본 카탈로그/상세 조회 경로에는 필수가 아니며, 공개 클라이언트 연동이 필요할 때만 사용한다.

## 경계
- 브라우저는 기본적으로 테이블 직접 접근을 전제로 설계하지 않는다.
- Next.js 서버 계층이 서버 자격증명으로 조회한다.
- 크롤러는 서버 자격증명으로 쓰기를 수행한다.
