# 017.rename-brand-whiskydamoa / brief

## 배경
- 사용자 요청에 따라 현재 프론트엔드와 관련 문서에 남아 있는 브랜드명 `Jururuk`/`주르륵`을 `위스키다모아`로 변경해야 한다.
- 현재 브랜드명은 메타데이터, 헤더/푸터 UI, 테스트, 일부 문서/레퍼런스 산출물에 분산되어 있다.

## 목표
- 현재 서비스의 사용자 노출 브랜드명을 `위스키다모아`로 통일한다.
- 메타데이터/헤더/푸터/테스트가 새 브랜드명 기준으로 동작하도록 맞춘다.
- 현재 참고용으로 열어볼 수 있는 문서/프로토타입에도 동일한 브랜드명을 반영한다.

## 범위
- `frontend/`의 현재 사용자 노출 문자열과 검증 코드
- 루트 `README.md`의 프로젝트 소개 제목
- `docs/references/stitch-layout-prototype.html`의 브랜드 문자열

## 비범위
- Java package, Gradle group, 데이터 모델, Supabase project ref 같은 내부 식별자 변경
- 완료된 exec-plan 아카이브의 과거 기록 수정
