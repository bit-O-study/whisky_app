# Implementation Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료
- 작업 진행 시 체크 상태를 즉시 갱신하고, 구조적 결정이나 범위 변경이 생기면 본 문서를 바로 수정한다.

## 방향
- 이번 이슈는 프론트 전면 재작성보다 "카탈로그 기능을 기준으로 얇은 클린 아키텍처 경계를 도입하는 작업"이다.
- 현재 기능 동작은 유지하고, 책임 분리와 의존 방향 정리를 우선한다.
- 신규 구조는 기존 코드와 일정 기간 공존할 수 있어야 하며, 한 번에 전체 기능으로 확장하지 않는다.
- 파일 수를 늘리는 것이 아니라 UI 변경 비용과 데이터 접근 결합도를 낮추는 것이 목적이다.

## 목표 구조 초안
```txt
frontend/src/
  entities/
    liquor/
      model/
      api/
  features/
    catalog/
      model/
      api/
      ui/
  shared/
    api/
    lib/
```

## 구조 원칙
- `entities`: 도메인 모델과 엔티티 단위 매핑 규칙만 둔다.
- `features`: 화면에서 사용하는 유스케이스, 상태 훅, feature 전용 UI를 둔다.
- `shared`: 프레임워크/인프라 공통 모듈만 둔다.
- UI 컴포넌트는 repository나 Supabase 접근을 직접 알지 않는다.
- 외부 응답 DTO와 도메인 모델은 분리하고, 변환은 mapper 경계에서 수행한다.
- 서버 선조회와 클라이언트 후속 조회는 같은 feature 규칙을 공유하되, 진입 함수는 서버/클라이언트 환경에 맞게 분리할 수 있다.

## [x] Phase 1. 현재 책임 분해 및 목표 경계 확정
### 목표
- 현재 카탈로그 기능의 책임이 어디에 섞여 있는지 분해하고, 새 구조의 실제 파일 경계를 확정한다.

### 작업
- [x] `CatalogPageClient.tsx`에서 상태 관리, 검색 debounce, 페이지 증가, 에러 복구, API 호출 책임을 분리 목록으로 정리한다.
- [x] `api/liquorApi.ts`, `lib/liquors.ts`, `types/liquor.ts`, `utils/groupLiquors.ts`의 책임을 분류해 새 위치를 결정한다.
- [x] `entities / features / shared` 구조를 이번 이슈의 기준 구조로 최종 확정한다.
- [x] 서버 선조회와 클라이언트 내부 API 호출이 어떤 계층을 공유할지 정리한다.

### 산출물
- 현재 책임 분해 메모
- 최종 폴더 구조 결정
- 파일별 이동/잔류 기준

### 책임 분해 메모
- `CatalogPageClient.tsx`
  상태: 검색어, debounce 결과, 현재 페이지, 다음 페이지 존재 여부, 로딩/추가 로딩, 에러, 재시도 토큰
  규칙: 초기 SSR 데이터가 있으면 첫 클라이언트 요청 생략, 검색 시 250ms debounce 후 0페이지로 재시작, 무한 스크롤 교차 시 page 증가, 0페이지 실패와 추가 페이지 실패 메시지 분기, 재시도 시 현재 page 기준 재호출
- `api/liquorApi.ts`
  책임: 내부 API route 호출, 응답 DTO 파싱, camelCase/snake_case 보정, `LiquorPage` 생성
- `lib/liquors.ts`
  책임: Supabase 조회, 페이지/사이즈 정규화, 검색 조건 구성, 가격 최신 행 선택, DB row -> 프론트 모델 매핑
- `types/liquor.ts`
  책임: 도메인 모델과 카드 표시용 그룹 모델이 한 파일에 혼재
- `utils/groupLiquors.ts`
  책임: 동일 상품명 기준 vendor 묶기, 최저가 계산

### 최종 구조 결정
- `entities/liquor/model`
  `Liquor` 도메인 모델과 엔티티 단위 표현을 둔다.
- `entities/liquor/api`
  외부 DTO와 DTO -> entity mapper를 둔다.
- `features/catalog/model`
  `CatalogPage`, 그룹 카드 모델, 페이지 merge/에러 메시지/초기 요청 skip 같은 조회 규칙을 둔다.
- `features/catalog/api`
  클라이언트 내부 API fetcher와 서버 repository 진입점을 둔다.
- `features/catalog/ui`
  `CatalogPageClient`, `LiquorGrid`, `LiquorCard`를 두고 feature model만 의존한다.
- `shared`
  이번 단계에서는 기존 `src/lib/supabase.ts` 등 인프라 공통만 유지하고 범위를 넓히지 않는다.

### 공유 경계 결정
- 서버 선조회와 클라이언트 내부 API 호출은 같은 `CatalogPage`와 `Liquor` 모델을 공유한다.
- 서버는 Supabase row -> entity 변환 뒤 `CatalogPage`를 반환한다.
- 클라이언트는 내부 API DTO -> entity 변환 뒤 같은 `CatalogPage`를 반환한다.
- 환경별 데이터 접근 구현은 분리하되, feature model 규칙은 공통으로 사용한다.

### 완료 기준
- 어떤 파일을 어디로 옮기고 왜 옮기는지 문서만으로 설명 가능해야 한다.
- 이후 단계에서 큰 구조 변경 없이 구현을 시작할 수 있어야 한다.

## [x] Phase 2. 엔티티 및 데이터 매핑 경계 분리
### 목표
- 도메인 모델과 외부 응답 DTO를 분리하고, 데이터 변환 책임을 UI 밖으로 이동한다.

### 작업
- [x] `types/liquor.ts`의 도메인 모델을 `entities/liquor/model` 기준으로 재배치한다.
- [x] 현재 `api/liquorApi.ts`에 있는 API 응답 타입을 DTO 계층으로 분리한다.
- [x] `camelCase/snake_case` 대응과 기본값 보정 로직을 mapper로 추출한다.
- [x] 카드/그리드가 사용하는 파생 타입이 entity에 둘지 feature model에 둘지 정리하고 이동한다.

### 산출물
- 분리된 entity model
- DTO 및 mapper 모듈
- UI 비의존 데이터 변환 경계

### 완료 기준
- UI 컴포넌트가 외부 응답 shape를 직접 알지 않아야 한다.
- 응답 포맷 변경 시 mapper나 repository만 수정하면 되는 구조여야 한다.

## [x] Phase 3. Repository 및 Usecase 계층 도입
### 목표
- 데이터 접근 책임과 조회 orchestration 책임을 분리한다.

### 작업
- [x] 내부 API 호출 로직을 catalog feature 기준 repository 또는 fetcher 모듈로 이동한다.
- [x] 서버 선조회용 `lib/liquors.ts` 접근도 같은 도메인 규칙을 따르도록 정리한다.
- [x] 검색어, 페이지, size, 초기 데이터, 재시도 규칙을 다루는 catalog usecase 또는 model 계층을 도입한다.
- [x] 목록 append, 첫 페이지 교체, 추가 로드 실패 처리 등 현재 동작 규칙을 테스트 가능한 함수/훅으로 옮긴다.

### 산출물
- catalog repository/fetcher
- catalog usecase/model
- 서버/클라이언트 공통 규칙 정리

### 완료 기준
- `CatalogPageClient`가 조회 상세 로직을 직접 소유하지 않아야 한다.
- 페이지네이션과 재시도 규칙이 UI 바깥에서 설명 가능한 구조여야 한다.

## [x] Phase 4. UI 계층 정리 및 의존 방향 고정
### 목표
- 화면 컴포넌트를 새 구조에 맞게 얇게 만들고, 의존 방향을 고정한다.

### 작업
- [x] `CatalogPageClient.tsx`를 `features/catalog/ui`로 이동하거나 래핑해 feature 진입점으로 정리한다.
- [x] 검색 입력, 로드 트리거, 에러 복구는 feature hook/model이 제공하는 상태와 액션만 사용하도록 바꾼다.
- [x] `LiquorGrid.tsx`, `LiquorCard.tsx`의 위치를 feature 전용 UI인지 재사용 UI인지 기준으로 재배치한다.
- [x] import 경로를 정리하고, UI -> feature/model -> entity/shared 방향 외 역의존이 없는지 점검한다.

### 산출물
- 얇아진 catalog UI 계층
- 정리된 import 방향
- 구조 기준에 맞춘 파일 배치

### 완료 기준
- 주요 UI 컴포넌트가 렌더링과 사용자 입력 처리 중심으로 줄어들어야 한다.
- 데이터 접근이나 응답 변환 로직이 UI에 남아 있지 않아야 한다.

## [x] Phase 5. 검증 및 문서 정리
### 목표
- 구조 전환 후 동작 회귀 여부를 확인하고, 이후 작업 기준 문서를 남긴다.

### 작업
- [x] `frontend`에서 `npm run lint`를 실행한다.
- [x] `frontend`에서 `npm run build`를 실행한다.
- [x] `frontend`에서 `npm run test:e2e`를 실행한다.
- [x] 최종 폴더 구조와 의존 규칙, 남은 전환 후보를 `progress.md`에 기록한다.
- [x] 필요하면 `prd.md`의 목표/범위를 실제 구현 방향에 맞게 보정한다.

## 구현 결과 메모
- `frontend/src/entities/liquor/model/liquor.ts`로 도메인 모델을 이동했다.
- `frontend/src/entities/liquor/api`에 DTO와 mapper를 두고 내부 API 응답 보정 로직을 이동했다.
- `frontend/src/features/catalog/model/catalog.ts`에 `CatalogPage`, 카드 표시 모델, 초기 요청 skip, 페이지 merge, 에러 메시지 규칙, 그룹핑 규칙을 모았다.
- `frontend/src/features/catalog/api/catalog-client.ts`와 `frontend/src/features/catalog/api/catalog-server.ts`로 클라이언트 fetcher와 서버 repository를 분리했다.
- `frontend/src/features/catalog/ui`로 카탈로그 UI를 이동하고 UI가 feature model만 의존하도록 정리했다.
- 단위 테스트 러너로 `Vitest`를 추가했고 `src/**/*.test.ts`만 실행하도록 `vitest.config.ts`를 추가했다.

### 산출물
- 검증 결과 기록
- 최신 진행 문서
- 후속 전환 기준

### 완료 기준
- 최소 검증 명령이 모두 통과해야 한다.
- 다음 작업자가 남은 이전 대상과 현재 구조 기준을 문서만으로 이해할 수 있어야 한다.

## 검증 전략
- 구조 변경 중에도 검색, 목록 조회, 무한 스크롤, 초기 서버 선조회가 유지되는지 계속 확인한다.
- 서버 선조회와 클라이언트 후속 조회가 서로 다른 모델을 만들어내지 않는지 점검한다.
- 리팩터링 과정에서 E2E가 초기 SSR 데이터와 클라이언트 검색 경로 모두에서 안정적인지 확인한다.
- 폴더 이동 이후 import 경로 정리만으로 끝내지 말고, 실제 책임이 줄었는지 코드 단위로 확인한다.

## 의존성 및 결정 필요 항목
- `LiquorGrid`, `LiquorCard`를 catalog feature 내부 UI로 둘지, 이후 재사용 가능성을 보고 `shared/ui`로 둘지 결정이 필요하다.
- 서버 선조회 함수와 클라이언트 fetcher가 같은 repository 인터페이스를 공유할지, 환경별 어댑터만 공유할지 구현 중 확정이 필요하다.

## 리스크
- 구조만 분리되고 실질 책임 이동이 없으면 "폴더만 클린 아키텍처" 상태가 될 수 있다.
- 현재 작은 코드베이스에서 레이어를 과도하게 세분화하면 오히려 탐색 비용이 커질 수 있다.
- 파일 이동 과정에서 import 경로나 타입 참조가 흔들리며 회귀가 생길 수 있다.
