# 036.admin-image-storage-upload / brief

## 요청
- 관리자 상품 정보 수정 화면에서 이미지 URL 직접 입력 대신 사진 파일을 올리면 Supabase Storage에 업로드하고 `liquor.image_url`을 자동 갱신한다.

## 가정
- 현재 배포/로컬 읽기 경로는 같은 Supabase 프로젝트를 바라본다.
- 기존 공개 이미지 URL이 `whisky-images` bucket을 사용하므로 새 관리자 업로드도 같은 bucket을 기본값으로 둔다.
- 업로드 API는 Next 서버 계층에서 service role key로 실행한다.

## 비목표
- 이미지 편집/리사이징/배경 제거
- 기존 Storage 파일 삭제 정책
- 인증 체계 추가
- 가격 정보 변경

## 성공 기준
- 관리자가 이미지 파일을 선택하면 서버 API가 Storage에 업로드하고 공개 URL을 생성한다.
- 업로드 성공 시 `liquor.image_url`이 새 공개 URL로 갱신되고 화면 preview도 즉시 바뀐다.
- 허용 이미지 타입과 크기 제한을 서버에서 검증한다.
- `npm run lint`, `npm run test`, `npm run build`가 통과한다.

## 검증
- `npm run lint`
- `npm run test`
- `npm run build`
