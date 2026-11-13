# 임시 Windows 롯데온 실행기

GitHub Actions가 매일 09:17 KST에 작업을 요청하고 사용자 PC의 전용 실행기가 수집한다. GitHub 기본 실행 서버에서 확인된 롯데온 접속 차단 때문에 사용자가 승인한 임시 구성이다. DB 키는 운영 Next.js 서버에만 둔다.

## 설치 및 경계
- 공식 actions/runner Windows x64 배포본의 SHA-256을 확인하고 저장소 밖 전용 폴더에 설치한다. 등록 토큰은 GitHub CLI로 메모리에만 받아 config.cmd에 전달한다.
- 기본 runner 라벨은 제거하고 `whisky-lotteon`만 등록한다. PR 검증은 GitHub 기본 서버에서 수행한다.
- `Assert-LotteonJob.ps1`을 실행기 애플리케이션/체크아웃 밖에 복사한다. `ACTIONS_RUNNER_HOOK_JOB_STARTED`로 저장소 ID, main, 정확한 workflow_ref, crawl job, schedule/workflow_dispatch를 실행 전에 검사한다. 필드 누락도 거부한다.
- 공식 훅 동작: [GitHub 문서](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/run-scripts).
- `Start-LotteonRunner.ps1 -RunnerDirectory <설치 폴더>`로 실행한다. 중복 실행을 막고 구성 셸의 GitHub 토큰을 제거한다.
- 현재 사용자 로그온 시 숨김으로 시작하고 5분마다 종료된 실행기를 재시작하는 Windows 예약 작업을 사용한다. 중지할 때는 먼저 예약 작업을 사용 안 함으로 설정한다. PC가 켜져 있고 로그인 및 네트워크 연결이 유지되어야 한다. 절전/전원 설정은 자동 변경하지 않는다.

## 검증 및 중지
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runner/Test-LotteonJobGuard.ps1`: 허용/거부 8가지 검증.
- GitHub main에서 limit=3으로 실제 수집 및 OIDC 저장을 확인한 뒤 전체 작업을 실행한다.
- Windows 예약 작업 `WhiskyLotteonRunner`를 중지/사용 안 함으로 설정하면 PC 실행기를 멈출 수 있다. 완전 제거 시 GitHub 저장소 Settings → Actions → Runners에서 전용 실행기도 제거한다. 공식 실행기 폴더의 자격증명·로그는 저장소에 커밋하지 않는다.

Windows에서 작업 래퍼를 강제 중지해도 자식 Listener가 남을 수 있다. 복구 스크립트는 같은 설치 폴더의 Listener가 이미 있으면 중복 시작하지 않는다. 완전히 중지할 때는 예약을 비활성화한 다음 해당 설치 폴더의 Listener까지 종료됐는지 확인한다.

## 예약 이벤트 누락 보완
`Install-LotteonWatchdog.ps1 -RunnerDirectory <설치 폴더>`는 현재 사용자 로그온 및 5분 반복 점검 작업 `WhiskyLotteonDailyWatchdog`를 설치한다. 09:30 KST 이후 오늘의 전체 수집 성공 기록과 GitHub 상태를 읽고 누락 시 같은 main 전체 작업을 호출한다. 진행/대기 작업이 있으면 기다린다. 호출 간 15분, 하루 최대 3회이며 GitHub 조회 실패 시 무작정 호출하지 않는다.

성공 기록은 실행기 상위의 lotteon-daily-state/success.json에 두며 전체·쓰기·저장 양수·오류 0인 실행만 만든다. 표본 실행은 오늘 완료로 취급하지 않는다. 늦은 GitHub schedule과 자동 보완 호출은 이미 오늘 전체 성공 기록이 있으면 중복 수집을 생략한다. 사용자 수동 전체 실행은 기본적으로 계속 허용한다.

점검 로그와 요청 상태도 같은 디렉터리에 보관한다. 설치 스크립트는 체크아웃 밖에 복사하고 GitHub 토큰을 파일에 저장하지 않는다. 점검 중지는 WhiskyLotteonDailyWatchdog 예약 작업을 사용 안 함으로 설정한다. 실행기 중지는 별도로 WhiskyLotteonRunner를 사용 안 함으로 설정한다.

점검의 시작/종료 및 제한된 오류 요약은 같은 상태 디렉터리의 task-launch.log에 기록한다. GitHub 응답은 실행 ID·이벤트·상태·시각 필드만 읽는다.
