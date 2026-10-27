# 진행

## 2026-10-27 실제 수집 후 로그인 차단 확인

- LAN/Tailscale 직접 SSH는 timeout. GitHub admin 실행기에서 기존 ADB daemon을 읽기 조회해 USB state=device 확인. 보호된 위스키 예약 결과와 task 정보는 접근 거부라 조회하지 못했다.
- 위스키 전용 실행기 bito-server-whisky_app는 기존 runtime.env 접근 및 공식 ADB client로 기기·앱 검사에 성공했다. inspect 실행40433387842: 지원39개, 미지원/중복114개.
- collect 실행40433560896: 등록39개 실제 시도, 관측0, 적격0, DB갱신0. 35개는 판매처 배지 없음, 2개는 URL판매처 불일치, 최초2개는 WebView/상세화면 미진입. DB 재조회에서 기존 가격을 보존했다.
- 화면 진단40434586695를 RSA/AES-GCM으로 암호화해 가져와 현재 PC에서만 복호화했다. 이마트5.3.0의 상품정보 화면에 '로그인 후 이용할 수 있는 서비스예요.' 표시. 새로운 휴대폰의 앱 로그인이 필요하며 가격 검증을 완화하지 않는다.
- 로그인 안내를 명확히 감지하면 needs_user_action/emart_login_required로 남은 순회를 중단하는 코드를 추가했다. 해당 보완은 GitHub runner 코드에 반영되며 보호된 pc계정의 04시 예약 설치본은 관리 접속 복구 후 갱신해야 한다. 다른 계정 TEMP 잠금이 전역이 아니므로 중복 예약을 만들지 않았다.
- 사용자에게 이마트 로그인→와인그랩 열기 및 필요한 성인인증/픽업점 선택 안내를 전달했다. 실제 가격 반영 완료로 보고하지 않는다.

- 2026-10-26: 로컬 PC ADB 기기0대. 사용자 응답으로 운영 서버 USB 연결 확인.
- 운영 서버 DESKTOP-FIRUT4I에서 Samsung USB 및 ADB Interface 정상 감지. 알려진 경로에 ADB 없어서 `C:/services/Bit-O/tools/whisky-adb/platform-tools`에 기존 SDK 실행파일을 설치했다.
- 실제 기기 `R39N505CG5Z`는 unauthorized. 사용자에게 휴대폰 USB 디버깅 항상 허용 요청 전달. 아직 실제 수집/DB 쓰기0건.
- 운영 DB 읽기: 링크153행 중 지원 앱 링크39개. 나머지는 미지원 웹 채널/중복으로 별도 집계.
- `Whisky-ADB-Bridge` 작업 Running, SSH 종료 후에도 ADB 서버 유지됨을 확인. localhost:5037만 사용한다.
- 단위테스트 25개 통과. 자동화는 모든 적용에 엄격한 상품명/용량 검증을 강제한다. 운영 서버 timezone이 Pacific Standard Time이므로 예약은 한국04시 UTC boundary를 사용한다.
- 예약 작업 `Whisky-ADB-Price-Refresh` 설치 완료. pc 계정, IgnoreNew, 2시간 실행 제한. 다음 실행 실제 조회값 `2026-10-26T19:00:00Z` / 한국 `2026-10-27 04:00:00`. 별도 도구 디렉터리는 Administrators/SYSTEM만 접근하도록 ACL을 제한했다.
- 예약 작업을 실제 시작해 LastTaskResult=1, latest.json의 failed, 관측0/갱신0을 확인했다. USB unauthorized가 원인이며 애플리케이션 성공으로 표시하지 않는다. 원본 로그는 서버 도구 디렉터리의 `artifacts/adb/automation`에 보존한다.
- Java/프론트 변경이 없어 해당 전체 빌드는 실행하지 않았다. 변경한 Node 수집기 테스트 및 JS 구문 검사, PowerShell AST 구문 검사, 실제 서버 예약 실행으로 검증했다.
