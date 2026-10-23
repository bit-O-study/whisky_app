# Architecture

## 개요
- 사용자 읽기 경로의 중심은 `frontend/`의 Next.js App Router다.
- 데이터 저장과 읽기 모델의 기준 저장소는 Supabase Postgres다.
- 쓰기 경로는 `backend/crawler`가 담당하고, 조회 중심 경로는 Spring API보다 Next.js 서버 계층에 가깝게 둔다.
- `backend/api`는 보조 관리/업로드 성격의 애플리케이션으로 유지한다.

## 시스템 경계
- `android/`
  공개 Next.js HTTPS 사이트를 표시하는 Android WebView 셸. DB/서비스 키를 포함하지 않으며 외부 서비스와 판매처 링크는 브라우저로 보낸다. APK는 웹 서버를 포함하지 않으므로 웹 UI 변경은 웹 배포 후 반영된다.
- `frontend/`
  Next.js App Router 기반 UI, 서버 컴포넌트, 내부 API route, 카탈로그 화면
- `backend/crawler/`
  Selenium + JPA 기반 수집/적재 경로
- `backend/common/`
  공통 엔티티, DTO, Repository
- `backend/api/`
  보조 운영 기능 및 별도 관리성 API
- `Supabase Postgres`
  `liquor`, `liquor_price`, `liquor_info` 및 읽기 모델/인덱스

## 주요 데이터 흐름
### 카탈로그 조회
1. 브라우저가 `frontend/`에 요청한다.
2. Next.js 서버 계층이 Supabase를 조회한다.
3. 서버는 화면 친화적인 카탈로그 모델로 정리해 UI에 전달한다.
4. 클라이언트는 검색, 무한 스크롤, 판매처 비교 상호작용만 처리한다.

### 적재
롯데온 일일 수집은 GitHub Actions에서 매일 00:00 UTC(09:00 KST)에 Java 크롤러를 단발 배치로 실행한다. 유효 가격이 없으면 기존 가격을 보존하며 저장 건의 확인 시각과 이력을 같은 시각으로 갱신한다. 실패/처리 0건은 작업 실패로 표시한다. 실제 활성화에는 기본 브랜치 반영 및 Actions DB 시크릿이 필요하다.

1. `backend/crawler`가 외부 쇼핑몰을 크롤링한다.
2. 크롤링 결과를 Supabase Postgres에 직접 적재한다.
3. 읽기 경로는 적재 결과를 기준으로 최신 가격과 카드 모델을 구성한다.

## 프론트엔드 구조 원칙
- 기본 구조는 `entities / features / shared`다.
- UI는 렌더링과 입력 처리에 집중한다.
- 조회 규칙, 페이지 조합, 응답 매핑은 feature/model 또는 entity/api 경계에 둔다.
- 자세한 규칙은 [docs/FRONTEND.md](/home/ubuntu/code/bitO-liquor/docs/FRONTEND.md)를 따른다.

## 문서 소스 오브 트루스
- 최상위 규범: [CONSTITUTION.md](/home/ubuntu/code/bitO-liquor/CONSTITUTION.md)
- 저장소 운영 규칙: [docs/REPOSITORY.md](/home/ubuntu/code/bitO-liquor/docs/REPOSITORY.md), [docs/CHANGE_POLICY.md](/home/ubuntu/code/bitO-liquor/docs/CHANGE_POLICY.md)
- 제품 동작 계약: [docs/product-specs/index.md](/home/ubuntu/code/bitO-liquor/docs/product-specs/index.md)
- 설계 결정: [docs/design-docs/index.md](/home/ubuntu/code/bitO-liquor/docs/design-docs/index.md)
- 실행 기록: [docs/PLANS.md](/home/ubuntu/code/bitO-liquor/docs/PLANS.md)
- 보안/신뢰성 기준: [docs/SECURITY.md](/home/ubuntu/code/bitO-liquor/docs/SECURITY.md), [docs/RELIABILITY.md](/home/ubuntu/code/bitO-liquor/docs/RELIABILITY.md)

### 로컬 ADB 수집
`scripts/adb/collect.mjs`는 USB 연결 PC에서 와인그랩 위스키 목록을 순회하고 검토 JSON/체크포인트를 `artifacts/adb/`에 저장한다. DB 쓰기 경로와 분리되어 있으며 기존 가격 계약에 자동 반영하지 않는다. PowerShell/Bash 진입점과 실행 방법은 `scripts/adb/README.md` 참조.
