# 021.admin-liquor-info-editor / progress

## 로그
- 2026-05-02: 라이브 `/admin/manual-entry`가 가격 입력 중심 폼임을 확인했다.
- 2026-05-02: 로컬 저장소에는 `admin` App Router 라우트가 없어 새 관리자 정보 수정 surface를 추가하는 방향으로 정리했다.
- 2026-05-02: 문서상 카탈로그 기준 테이블은 `public.liquor`, 가격 기준 테이블은 `public.liquor_price`임을 확인했다.
- 2026-05-02: `/api/admin/liquors` 조회 API와 `/api/admin/liquors/[id]` 가격 외 필드 수정 API를 추가했다.
- 2026-05-02: `/admin/liquor-info` 화면을 추가해 검색, 선택, 이미지 미리보기, 카탈로그 정보 수정을 한 흐름으로 묶었다.
- 2026-05-02: 가격형 입력이 업데이트 patch에 포함되지 않는 단위 테스트를 추가했다.
- 2026-05-02: 기존 카탈로그 테스트 실패 원인이 source별 URL 조인 부재 시 `product_url` fallback을 쓰지 않는 문제임을 확인하고, fallback을 복구했다.
- 2026-05-02: 기존 `any` lint 오류를 상세/서버 타입으로 치환하고 상세 화면 용량 표시를 `CatalogCardItem.volume` 기준으로 맞췄다.
- 2026-05-02: `npm run lint`, `npm run test`, `npm run build` 통과를 확인했다.
- 2026-05-02: 로컬 dev 서버에서 `/admin/liquor-info`와 `/api/admin/liquors?page=0&size=1`가 200으로 응답함을 확인했다.
