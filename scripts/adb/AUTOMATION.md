# 등록 링크 정기 가격 갱신

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
