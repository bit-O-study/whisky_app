# INTERFACE_MATRIX

## 목적
- 저장소 내부의 주요 producer/consumer 경계를 명시한다.
- 어떤 직접 의존이 허용되고 어떤 경로는 예외인지 기록한다.

## Matrix

### Browser -> Next.js
- 허용
  페이지 요청, 내부 API 호출
- 금지/비권장
  서버 전용 SDK 직접 사용, DB 직접 접근

### Next.js Server -> Supabase
- 허용
  카탈로그 읽기 모델 조회, 응답 매핑, 에러 정규화
- 규칙
  서버 자격증명 사용, 데이터 계약은 design docs에 먼저 반영

### Next.js Client -> Next.js Server
- 허용
  `/api/liquors`, `/api/liquors/search` 같은 내부 API 호출
- 규칙
  외부 서비스가 아니라 내부 서버 경계를 거친다

### backend/crawler -> Supabase Postgres
- 허용
  직접 write, upsert, 적재 검증
- 규칙
  적재 기준과 인덱스 가정은 `ARCHITECTURE`와 관련 design docs에 반영

### backend/api -> External Consumer
- 허용
  보조 관리/업로드성 기능
- 비권장
  현재 카탈로그 기본 읽기 경로를 다시 소유하는 것

### frontend -> backend/api
- 기본 정책
  현재 핵심 읽기 경로로는 사용하지 않는다
- 예외
  별도 운영성 기능이 필요해 명시적으로 도입하는 경우

### docs/exec-plans -> durable docs
- 허용
  작업 완료 후 반복 가치가 있는 판단을 승격
- 규칙
  실행 로그를 durable docs에 그대로 복사하지 않고 요약/정제해 반영

## Current High-Risk Interfaces
- 검색 성능 최적화와 멀티벤더 카드 계약의 충돌 가능성
- crawler write path와 generated schema snapshot의 드리프트
- client fetch 흐름과 server-only 보안 경계의 혼동
