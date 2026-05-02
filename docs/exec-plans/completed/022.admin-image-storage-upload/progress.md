# 022.admin-image-storage-upload / progress

## 로그
- 2026-05-02: Supabase 공식 문서에서 Storage `.upload(...)` 후 public bucket은 `.getPublicUrl(...)`로 공개 URL을 만들 수 있음을 확인했다.
- 2026-05-02: 기존 Spring 보조 API도 Supabase Storage에 파일을 올리고 공개 URL을 반환하는 패턴을 가지고 있음을 확인했다.
- 2026-05-02: Next 서버 API `/api/admin/liquors/[id]/image`를 추가해 multipart 이미지 파일을 Storage에 업로드하고 `liquor.image_url`을 갱신하도록 구현했다.
- 2026-05-02: 관리자 UI에서 이미지 URL 직접 입력을 제거하고, 사진 파일 선택 시 즉시 업로드/DB 반영/preview 갱신이 되도록 바꿨다.
- 2026-05-02: 이미지 타입/용량 검증과 Storage path 생성 단위 테스트를 추가했다.
- 2026-05-02: `npm run lint`, `npm run test`, `npm run build` 통과를 확인했다.
- 2026-05-02: 로컬 dev 서버에서 `/admin/liquor-info` 200, 빈 multipart `/api/admin/liquors/870/image` 요청 400 검증을 확인했다.
