# 위스키다모아 검수보고서

검수일: 2026-10-15 · 대상 버전: Android 1.0.2(code 3) · 구현 커밋: 26727ed

## 1. 새 로고

![위스키다모아 새 로고: 코발트 배경, 금색 W와 위스키 잔](../exec-plans/completed/20261015-brand-logo-v2/logo-master.png)

**위스키 테이스팅 잔과 금색 W를 하나로 결합한 심벌**이다. W는 Whisky를 뜻하며, 잔 안의 앰버색 위스키로 서비스의 주제를 표현했다. 짙은 코발트 배경과 금색의 대비로 홈 화면에서 눈에 띄도록 구성했다.

- 기존: 밝은 파란 배경의 병·잔·반짝임을 조합한 평면 아이콘.
- 변경: 잔과 W를 합친 단일 심벌, 금속 질감과 입체감, 짙은 코발트 배경.
- 글자는 아이콘 안에 넣지 않고 웹 헤더에서 서비스 이름과 함께 표시한다.
- Android 테마 아이콘은 금속 질감을 제거하고 W·잔 실루엣을 단색 벡터로 표현한다.

### 적용 위치

| 위치 | 파일/적용 내용 |
|---|---|
| 웹 헤더 | `frontend/public/branding/app-icon-v2.png` · 512px 원본을 40px로 표시 |
| 브라우저 아이콘 | `frontend/app/icon.png` · 128px |
| Apple 홈 화면 | `frontend/app/apple-icon.png` · 180px |
| Android 홈 화면 | `android/app/src/main/res/drawable-nodpi/launcher_artwork.png` · 512px |
| Android 테마 아이콘 | `ic_launcher_monochrome.xml` · 단색 W/잔 |
| 제작 원본 | [logo-master.png](../exec-plans/completed/20261015-brand-logo-v2/logo-master.png) |

제작: 내장 image_gen 도구와 imagegen 스킬 사용. 생성 후 도안 수정 없이 배포 크기만 변환했다. [생성 프롬프트·작업 기록](../exec-plans/completed/20261015-brand-logo-v2/progress.md).

## 2. 로고·앱 검증 결과

| 검증 항목 | 결과 |
|---|---|
| 웹 lint / production build | 통과 |
| 웹 단위 테스트 | 32개 통과 |
| 브라우저 PC·모바일 흐름 | 7개 통과 |
| Android assembleDebug | 성공 |
| Android lintDebug | 오류 0개, 경고 6개 |
| APK 서명 | 검증 통과, 기존 APK와 동일한 개발용 인증서 |
| 운영 웹 헤더 | 새 로고 경로 사용 확인 |
| 운영 로고 파일 | HTTP 200, 로컬 파일과 SHA-256 일치 |
| GitHub 릴리즈 | 1.0.2 공개 prerelease, APK 업로드 완료 |
| 실제 휴대폰에 새 APK 설치 | **미검증** |
| Android 기종별 실제 런처 마스크·테마 표시 | **미검증** |

운영 확인 시각: 2026-10-15 14:32 KST. [배포 확인 기록](../exec-plans/completed/20261015-brand-logo-v2/published-check.json).

브라우저 테스트가 실제 DB 사전 로딩과 섞이던 문제를 발견해 테스트 웹 서버의 DB 환경만 격리했다. 운영 DB 설정은 변경하지 않았다.

## 3. 가격 데이터 검수 및 반영

- 이마트/트레이더스 앱 목록에서 **43개** 수집.
- 이름·용량·할인조건 검사 통과 **3개**. 이 중 기존 이마트 가격 행과 상품 상세까지 대조한 **1개 반영**.
- 신규 판매처 가격 후보 **2개**는 상세 미검증으로 보류.
- 나머지 **40개**는 기존 상품 불일치 또는 조건부 가격 등으로 제외.

| 상품 | 판매처 | 변경 전 | 변경 후 | 검증 |
|---|---|---:|---:|---|
| 존바 리저브 750ml | 이마트 | 15,800원 | **19,800원** | 앱 목록·상세 일치, DB 재조회, 운영 검색 API 확인 |

관측 시각: 2026-10-15 13:37:47 KST. 지점은 사용자 요청에 따라 화면에 추가하지 않고 로컬 근거에만 보존했다. 카드할인가를 일반가로 반영하지 않았으며 전체 상품 가격을 갱신한 것은 아니다.

추가 발견: 기존 DB의 벤치마크 상품은 이름의 1,750ml와 용량 필드 750ml가 달라 자동 매칭 대상에서 제외했다. 데이터 검증·파서 테스트 15개 통과.

기기 캡처, DB 변경 전 백업과 변경 영수증은 Git 제외 폴더 `artifacts/adb/price-update-20261015/`에 보관한다.

## 4. 확인 및 다운로드

### 후속 가격 갱신 (2026-10-15 17시 전후)

위 43개/1개 기록은 최초 표본 작업 결과다. 이후 기존 이마트·트레이더스 링크 38개를 직접 순회하여 **16건의 가격/관측시각을 갱신**했다(금액 변경 5건, 동일 가격 11건). DB 재조회와 운영 검색 API를 확인했다. 상품명 표기 차이는 실제 저장된 URL 연결을 기준으로 처리한다. 블론드 링크가 블랙 루비로 연결되는 2건은 잘못된 연결로 제외했다. 조건부 할인·픽업불가 등 나머지 사유와 근거는 실행 기록에 남겼다. 신규 상품 및 실제 상세 링크의 전체 수집은 진행 중이며 하이랜드 파크 17년·와일드터키 레어브리드 라이·켄터키 아울 타쿠미 3개와 판매처 상세 링크 3개를 신규 등록하고 재조회했다. 신규 가격은 별도 검증 중이다.

- [운영 웹](https://whisky-app-vert.vercel.app)
- [Android 1.0.2 릴리즈](https://github.com/bit-O-study/whisky_app/releases/tag/android-v1.0.2)
- [APK 다운로드](https://github.com/bit-O-study/whisky_app/releases/download/android-v1.0.2/whiskydamoa-1.0.2-debug.apk)

APK: 개발용(debug) 서명, 352,920 bytes.
SHA-256: `5bf6261cf9e508523c77f54e30309def20bf7276b39b8e8e55ccc7c89fb3cd3f`

새 앱 아이콘을 휴대폰에 적용하려면 새 APK 설치가 필요하다. 웹 로고는 이미 배포됐다.
