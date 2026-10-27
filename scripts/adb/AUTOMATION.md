# 등록 링크 정기 가격 갱신

## GitHub 수동 실행

운영 PC 직접 연결이 안 될 때는 `Registered ADB prices` 워크플로를 main에서 실행한다. `inspect`는 기기·앱·DB 연결 검사, `collect`는 DB 변경 없는 실제 상세 수집·검증, `apply`는 재수집 후 검증 통과 가격만 반영한다. 위스키 전용 `bito-whisky_app` 실행기와 기존 프로젝트 runtime.env를 사용하며 다른 프로젝트 권한을 변경하지 않는다.

이미 실행 중인 localhost:5037 ADB 연결이 있어야 시작한다. 공식 Android platform-tools를 실행기 임시 폴더에 준비하고 고정 기기를 사용한다. `adb-price-summary-<run>` 아티팩트에 관측·반영 수, 검토 사유, DB 재조회 결과만 7일간 보관한다. 원본 UI 텍스트와 DB 백업은 업로드하지 않는다. Windows의 04시 예약과 동시에 수동 수집하지 않는다.

2026-10-27 검사에서 USB 승인은 `device`, 앱 설치 및 기존 설정 접근은 정상, 지원 링크39개를 확인했다. 어드민 실행기는 위스키 예약 작업/결과 파일을 읽을 권한이 없어 별도 진단의 권한 오류를 정상적인 접근 제한으로 보고한다.

첫39개 검증은 로그인 미완료로 관측0/반영0이었다. 사용자 요청에 따라 2026-10-27 네이버 로그인을 한 번 제출한 후 재검증에서 가격36개 관측, 자동 반영 적격13개를 확인했다. `emart_login_required`가 발견되면 남은 링크를 순회하지 않고 `needs_user_action`으로 중단하며 DB에 쓰지 않는다. 원본 화면은 공개 로그/아티팩트에 올리지 않으며 `screen` 진단은 요청자의 RSA 공개키로 암호화한 자료만 업로드한다.

운영 apply 실행40440323641에서13개 가격행을 갱신하고 DB를 다시 읽어 확인했다(가격변경2개, 동일가격 관측갱신11개). 나머지26개는 검증 보류이며 미지원/중복114개는 별도 집계다. `partial`은 안전 보류가 포함된 부분 처리로, GitHub job exit2/failure만 보고 전체 반영 실패라고 해석하지 않는다.

로그인 지원은 수동 workflow의 `login_prepare`/`login_submit`으로만 동작한다. 공식 이마트 앱의 네이버 OAuth 폼을 확인하고 15분짜리 RSA 공개키를 발급한다. 사용자 정보는 암호문으로만 전달하며 서버 프로세스 메모리에서 복호화해 ADB stdin으로 입력한다. 입력 이후 화면은 `exec-out uiautomator dump /dev/tty`로 메모리에만 읽고 스크린샷/화면 파일을 만들지 않는다. 한 번만 제출하며 추가 인증은 중단한다. 개인키는 제한된 서비스 계정 저장소에 두고 제출 작업의 finally에서 삭제한다.

2026-10-27의 GitHub runner 코드 개선은 보호된 pc계정 예약 설치 경로에 자동 복사되지 않는다. 직접 서버 관리 접속이 복구되면 해당 설치 경로를 갱신해야 한다. 현재 repo 실행 잠금과 TEMP 기기 잠금은 다른 Windows 계정 사이 전역 잠금이 아니므로, pc 예약과 runner 수동 실행을 동시에 실행하지 않는다. 두 실행 경로를 중복 예약하지 않는다.

`node scripts/adb/automate.mjs --check`는 승인된 ADB 기기, 이마트 앱 설치, DB 연결과 등록 링크를 확인한다. 실제 화면 수집은 `node scripts/adb/automate.mjs`, 검증 통과 가격 반영은 `node scripts/adb/automate.mjs --apply`다. `ADB_PATH`, `ADB_SERIAL`, `WHISKY_ENV_FILE`로 실행 환경을 지정한다. 기기가 여러 대면 serial 지정이 필수다.

- 실행마다 DB `liquor_url`을 페이지 단위로 전부 읽는다. EMART/EMART_TRADERS의 공식 앱 링크만 큐에 포함하며 동일 상품·판매처·URL 중복을 제거한다. SSG 등 웹 채널은 지원 대상이 아니며 기존 다른 크롤러에는 영향을 주지 않는다.
- 자동 반영은 이름과 용량까지 엄격하게 일치해야 한다. 기존 수동 링크 검수 도구의 이름 별칭 허용은 자동 실행에 적용하지 않는다. 일반 판매가·픽업가능·최근 관측·40% 이하 변동·live URL binding·가격행 1개 조건이 모두 필요하다.
- 상품 상세 진입 실패/로그인 필요/품절/조건부 할인/다른 이름 등은 가격을 변경하지 않고 사유를 남긴다. 미지원 링크 수와 실제 수집 실패 수는 구분한다. 신규 상품/가격행 생성은 하지 않는다.
- `artifacts/adb/automation/latest.json`과 실행별 `status.json`, `observations.json`, `price-apply-*.json`에 성공/부분 성공/실패, 관측 수, 갱신 수, 실패 사유, 변경 전 가격을 기록한다. 원본은 Git 제외다. exit 0=전체 처리 성공(또는 검증), 2=부분 처리/검토 필요, 1=실행 실패다.
- 기기 잠금과 배치 잠금, 스케줄러 IgnoreNew로 동시 실행을 막는다. 강제 종료 후 남은 잠금은 해당 프로세스가 종료됐는지 확인하고 제거한다. 실패시 정상 가격/관측시각을 갱신하지 않는다.

Windows 예약 설치 예:

```powershell
.\scripts\adb\install-schedule.ps1 -AdbPath C:\Android\platform-tools\adb.exe -Serial DEVICE_SERIAL -EnvFile C:\secure\runtime.env -DailyAt 04:00 -Apply
```

SSH 종료 후에도 USB 승인 연결을 유지하려면 운영 계정으로 `install-bridge.ps1 -AdbPath C:\Android\platform-tools\adb.exe`를 한 번 설치한다. `Whisky-ADB-Bridge`는 로그인 시 ADB 서버를 localhost:5037에만 실행한다. 두 작업은 같은 계정을 사용한다. 승인은 휴대폰에서 직접 수행하며 자동으로 우회하지 않는다. 제거할 때는 해당 이름의 예약 작업을 중지/삭제한다.

예약 이름은 `Whisky-ADB-Price-Refresh`이며 한국 시각 기준 매일04시를 UTC StartBoundary로 고정한다. 기존 동일 작업은 덮어쓰지 않는다. 현재 로그인 사용자 세션에서 실행하므로 서버 재시작 후 해당 운영 계정 로그인이 필요하다. PC/휴대폰 연결, 휴대폰 USB 디버깅 항상 허용, 잠금 해제, 이마트 로그인 유지가 필요하다. 서버 보호된 설정 파일을 읽는 운영 계정은 `-RunElevated`를 사용할 수 있다. 자격증명은 작업 인수나 로그에 넣지 않는다.

이 파이프라인은 기존 `liquor_price` 갱신 경로를 사용한다. 별도의 `liquor_price_history` 적재는 기존 파이프라인 보강 작업 범위에 남아 있으며 이 자동화만으로 가격 이력 적재까지 완료됐다고 간주하지 않는다.
