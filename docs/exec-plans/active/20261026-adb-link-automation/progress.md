# 진행

- 2026-10-26: 로컬 PC ADB 기기0대. 사용자 응답으로 운영 서버 USB 연결 확인.
- 운영 서버 DESKTOP-FIRUT4I에서 Samsung USB 및 ADB Interface 정상 감지. 알려진 경로에 ADB 없어서 `C:/services/Bit-O/tools/whisky-adb/platform-tools`에 기존 SDK 실행파일을 설치했다.
- 실제 기기 `R39N505CG5Z`는 unauthorized. 사용자에게 휴대폰 USB 디버깅 항상 허용 요청 전달. 아직 실제 수집/DB 쓰기0건.
- 운영 DB 읽기: 링크153행 중 지원 앱 링크39개. 나머지는 미지원 웹 채널/중복으로 별도 집계.
- `Whisky-ADB-Bridge` 작업 Running, SSH 종료 후에도 ADB 서버 유지됨을 확인. localhost:5037만 사용한다.
- 단위테스트 25개 통과. 자동화는 모든 적용에 엄격한 상품명/용량 검증을 강제한다. 운영 서버 timezone이 Pacific Standard Time이므로 예약은 한국04시 UTC boundary를 사용한다.
- 예약 작업 `Whisky-ADB-Price-Refresh` 설치 완료. pc 계정, IgnoreNew, 2시간 실행 제한. 다음 실행 실제 조회값 `2026-10-26T19:00:00Z` / 한국 `2026-10-27 04:00:00`. 별도 도구 디렉터리는 Administrators/SYSTEM만 접근하도록 ACL을 제한했다.
- 예약 작업을 실제 시작해 LastTaskResult=1, latest.json의 failed, 관측0/갱신0을 확인했다. USB unauthorized가 원인이며 애플리케이션 성공으로 표시하지 않는다. 원본 로그는 서버 도구 디렉터리의 `artifacts/adb/automation`에 보존한다.
- Java/프론트 변경이 없어 해당 전체 빌드는 실행하지 않았다. 변경한 Node 수집기 테스트 및 JS 구문 검사, PowerShell AST 구문 검사, 실제 서버 예약 실행으로 검증했다.
