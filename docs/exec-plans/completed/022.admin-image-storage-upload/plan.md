# 022.admin-image-storage-upload / plan

## 단계
- [x] Supabase Storage 업로드 API와 bucket 기준을 확인한다.
- [x] 서버 전용 업로드 helper와 `/api/admin/liquors/[id]/image` route를 추가한다.
- [x] 관리자 UI에서 파일 선택/업로드/preview 갱신 흐름을 추가하고 URL 직접 편집을 제거한다.
- [x] 업로드 helper 단위 테스트를 추가한다.
- [x] 검증 명령을 실행하고 실행 기록을 완료 폴더로 이동한다.

## 결정 경계
- Storage bucket은 `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `SUPABASE_STORAGE_BUCKET`, 기본값 `whisky-images` 순서로 결정한다.
- 업로드 path는 `admin-liquor-images/<liquor-id>/<timestamp>-<safe-file-name>`으로 둔다.
- 이미지 업로드는 즉시 DB를 갱신하며, 나머지 상품 정보 저장 버튼과 별도 동작이다.
