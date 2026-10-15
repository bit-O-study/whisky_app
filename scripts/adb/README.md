# 와인그랩 ADB 반복 수집

Node.js 20 이상과 Android platform-tools(ADB)가 필요하다. 휴대폰 USB 디버깅을 승인하고 이마트 앱에서 로그인한 뒤 **와인그랩 홈 또는 위스키 카테고리**를 열어 둔다. 수집 중에는 화면을 직접 조작하지 않는다.

```powershell
# 저장소 루트에서 실행: 이마트 → 트레이더스 자동 전환
.\scripts\collect-winegrab.ps1
# 짧은 검증, 특정 ADB 경로
.\scripts\collect-winegrab.ps1 --adb C:/Users/NB0075/android-sdk/platform-tools/adb.exe --max-pages 4
# 기존 결과 유지, 처음부터 재순회하며 중복 제거
.\scripts\collect-winegrab.ps1 --out artifacts/adb/my-run --resume
# 판매처 하나만
.\scripts\collect-winegrab.ps1 --sources TRADERS
# 신규 상품과 실제 공유 상세 링크를 함께 저장
.\scripts\collect-winegrab.ps1 --links --max-pages 2000 --out artifacts/adb/full-links
```

Linux/macOS에서는 `bash scripts/collect-winegrab.sh` 또는 모든 OS에서 `node scripts/adb/collect.mjs`로 실행한다. `ADB_PATH` 환경변수 또는 `--adb`로 경로를 지정할 수 있다. 기기가 여러 대면 `--serial`을 지정한다.

## 동작과 결과

- 이마트와 트레이더스를 순서대로 선택하고 목록을 겹치게 스크롤한다. 상품 상세 페이지를 하나씩 열지 않는다.
- 화면에 가격과 판매처 배지가 실제 노출되는 상품만 읽는다. 배경 WebView, 화면 밖 미리 로드된 상품, 하단 메뉴에 잘린 가격은 제외한다.
- `artifacts/adb/<실행시각>/products.json`에 상품명, 용량, 표시가격, 정상가, 할인조건, 판매처, 관측시각과 읽은 상품 원문을 저장한다. 폴더는 Git에서 제외한다.
- `checkpoint.json`에 매 화면 결과와 진행 상태를 저장한다. Ctrl+C/오류 후 `--out 같은폴더 --resume`으로 기존 결과를 유지하며 다시 순회한다. 화면 위치를 복원하는 방식은 아니다.
- 판매처+전체 상품명으로 중복 제거한다. 용량과 기획세트 이름을 보존한다. 상품 ID가 없으므로 동일 이름의 별도 SKU를 완벽하게 식별하지는 못한다.
- 3번 연속 같은 상품 화면이면 `stalled_or_end`로 종료한다. 목록 끝과 앱 로딩 정체를 확실히 구분할 수 없어 전체 수집 완료로 표시하지 않는다.
- 기본 판매처당 200화면. `--max-pages 1~2000`으로 변경하며 한도 도달은 `page_limit`으로 기록한다.
- 로그인/팝업/전면 앱 변경/상품 배지 불일치 시 기존 결과를 보존하고 중단한다. ADB 읽기는 최대 3번 재시도한다.
- 기기별 잠금으로 동시 수집을 막는다. 강제 종료 후 잠금이 남으면 해당 수집 프로세스가 종료됐는지 확인하고 오류에 표시된 잠금 파일만 제거한다.

## 가격의 의미

목록의 최대할인가/카드할인가를 일반 판매가로 변환하지 않는다. 상세 카드 조건, 지점, 재고, 상품 ID는 이번 목록 수집 범위에서 확정하지 못한다. 모든 결과는 `review_required: true`이며 DB 자동 적재는 하지 않는다. 현재 자동 순회 카테고리는 **위스키**다.

검증: `node --test scripts/adb/winegrab-parser.test.mjs`

## 데이터 검증

가격 반영 전 DB 스냅샷(`liquor`, `liquor_price` 배열)과 비교한다.

```powershell
node scripts/adb/validate-file.mjs artifacts/adb/my-run/products.json artifacts/adb/my-run/db-before.json artifacts/adb/my-run/validation.json
```

공백/괄호/단위 표기만 정규화하여 동일 이름과 용량을 검사한다. 라이, CS, 숙성 연수, 전용잔/기획세트 등 이름 내용은 제거하지 않는다. 중복 상품, DB 이름과 용량의 불일치, 조건부 할인, 24시간 이상 지난 관측, 40%를 넘는 가격 변동은 검토 대상으로 차단한다. 통과는 상세 화면 검토 대상이라는 뜻이며 DB 쓰기 승인이 아니다. 앱 상세의 판매처/용량/가격/조건과 대조 후 반영해야 한다.

검증 테스트: `node --test scripts/adb/validate.test.mjs scripts/adb/winegrab-parser.test.mjs`

판매량순: `--sort sales` (기본 신상품순). 특정 상품의 상세 확인: `--sources EMART --sort sales --review-name "존바 리저브 750ml"`. 해당 상품 발견 시 목록/상세 캡처와 XML을 출력 폴더에 저장하고 멈춘다. 캡처 파일은 계정정보가 포함될 수 있어 외부 공유/커밋하지 않는다. 화면을 사람이 대조하기 위한 근거이며 자동 검증 완료를 뜻하지 않는다.

## 기존 링크 갱신과 신규 발견

기존 상품은 `liquor_url` 연결을 기준으로 직접 상세 페이지에 진입한다. 목록 전체를 다시 검색할 필요가 없다. `refresh-links.mjs`는 큐의 단축 URL을 실제 공식 상품 주소로 해석하고 `emart-today` 딥링크로 앱을 열어 표시 가격을 저장한다. `EMART_TRADERS`와 `EMART`를 구분하며 SSG 웹 채널은 이 앱 수집기에 섞지 않는다. 현재 기기 serial은 Galaxy S23 개발 기기로 고정돼 있다.

```powershell
node scripts/adb/refresh-links.mjs QUEUE.json DB_SNAPSHOT.json OBSERVATIONS.json
# 기본은 계획만 출력. --apply는 DB 갱신 후 재조회까지 수행한다.
node scripts/adb/apply-link-prices.mjs OBSERVATIONS.json
node scripts/adb/apply-link-prices.mjs OBSERVATIONS.json --apply
```

큐는 `liquor_url` 행 배열, DB 스냅샷은 `liquor` 배열을 포함한다. 실제 DB에 같은 상품/판매처/URL 연결이 존재하면 상품명의 표기 차이를 이유로 갱신을 차단하지 않는다. 확인된 오연결(블론드 링크가 블랙 루비로 연결됨), 용량 불일치, 조건부 가격, 픽업불가, 오래된 관측, 큰 가격 변동은 별도 검토한다. 가격이 같더라도 확인 시각을 갱신하며 재실행 시 이미 반영한 관측은 건너뛴다. 변경 전 DB와 영수증은 입력 파일 옆에 저장한다.

신규 발견은 `collect.mjs --links`를 사용한다. 상세의 공유하기 → 더보기에서 Android 공유 미리보기 제목과 실제 URL만 읽고 닫는다. 공유 대상은 선택하지 않으며 연락처/공유 시트 원문은 결과에 저장하지 않는다. 이 모드는 상품별 상세 왕복 비용이 추가된다. `register-products.mjs`는 상품 메타데이터의 등록 계획/적용 도구이며 가격을 쓰지 않는다. 신규 후보는 링크와 기존 별칭을 대조한 뒤 등록해야 한다.
