# 021.admin-liquor-info-editor / plan

## 단계
- [x] 기존 카탈로그/Supabase 경계와 관리자 페이지 부재를 확인한다.
- [x] 가격 외 수정 API의 조회/업데이트 계약을 추가한다.
- [x] `/admin/liquor-info` 화면과 클라이언트 편집 UI를 추가한다.
- [x] API/모델 단위 테스트를 추가한다.
- [x] 검증 명령을 실행하고 실행 기록을 완료 폴더로 이동한다.

## 결정 경계
- 인증은 기존 live admin surface와 동일하게 이번 범위 밖으로 둔다.
- 수정 필드는 `liquor` 테이블의 카탈로그 노출 정보로 한정한다.
- `liquor_price`는 읽지도 쓰지도 않는다.
