# 2026-11-13 롯데온 예약 누락 복구

## 확인된 상태
- 15:31 KST 기준 오늘 schedule 실행이 생성되지 않았다. 워크플로는 active, PC 실행기는 online이었다.
- 11월 10~12일 예약은 성공했지만 생성 시각이 오후로 지연됐다. GitHub 내부 지연·누락 사유는 외부 API로 확정할 수 없으며 서비스 장애로 단정하지 않는다.

## 오늘 수집
- [전체 실행 43379261295](https://github.com/bit-O-study/whisky_app/actions/runs/43379261295): 성공.
- 기존 LOTTEON 연결 111개 전수 확인, 99개 저장·12개 보류·오류 0.
- 운영 사이트 API의 가격·정상가·링크·관측 시각 99/99 일치 확인. 보류 상품은 기존 값을 유지한다.

## 적용한 복구
- 기본 GitHub 예약은 UTC 00:17, 한국 시간 09:17로 명시한다.
- PC의 별도 예약 작업 WhiskyLotteonDailyWatchdog가 로그인 시 시작하고 5분마다 점검한다. 09:30 KST 이후 당일 전체 성공 기록과 GitHub 진행/대기 상태를 확인해 누락이면 기존 main 전체 워크플로를 호출한다.
- 진행/대기 중 작업은 중복 호출하지 않는다. 요청 간 15분, 하루 최대 3회다. GitHub 상태를 조회하지 못하면 무작정 호출하지 않는다.
- 전체·쓰기·저장 양수·오류 0인 실행만 완료 기록을 만든다. 표본·읽기 전용·실패 실행은 오늘 완료로 취급하지 않는다.
- 늦은 schedule과 자동 보완 호출은 오늘 완료 기록이 있으면 중복 수집을 생략한다. 사용자의 일반 수동 전체 실행은 계속 가능하다.
- DB 키와 실행 전 훅·OIDC 경계는 유지한다. PC 점검은 기존 사용자 GitHub CLI 인증으로 정해진 저장소/main 워크플로만 요청한다.

## 실제 검증
- Node/PostgreSQL 회귀 28개, PowerShell 시간/상태/요청 제한 11개와 원격 CI 통과.
- Windows 예약에서 전체 응답 JSON 변환이 실패한 문제는 필요한 ASCII 상태 필드만 읽도록 수정했다. 별도 실행 래퍼에 짧은 시작/종료/오류 로그를 남기며 토큰과 전체 API 응답을 출력하지 않는다.
- 15:51 KST 실제 Windows 점검이 main 전체 작업을 호출하고 코드 0으로 종료했다.
- [복구 호출 43381649699](https://github.com/bit-O-study/whisky_app/actions/runs/43381649699): 모든 job 성공. 검증한 오늘 전체 완료 기록을 확인해 LOTTEON_DAILY_ALREADY_UPDATED로 중복 수집 없이 종료했다.
- 이후 자동 반복 점검도 already-updated-today 및 종료 코드 0을 확인했다.
- 오늘 수동 실행은 완료 기록 도입 전 버전이므로, 최초 기록은 검증한 실행 결과로 초기화했다. 이후 전체 성공은 크롤러가 직접 기록한다.

## 운영 조건
PC 전원·로그인·네트워크 연결이 필요하다. 전원/절전 정책은 변경하지 않았다. 미래의 예약 성공을 보장한다고 기록하지 않으며, 확인한 실제 복구·중복 방지 동작을 근거로 운영한다.

관련: [PR #15](https://github.com/bit-O-study/whisky_app/pull/15), [PR #16](https://github.com/bit-O-study/whisky_app/pull/16), [이슈 #3](https://github.com/bit-O-study/whisky_app/issues/3).
