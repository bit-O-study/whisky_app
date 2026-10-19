# 진행

- 기존 서버 페이지에 loading.tsx가 없고 목록 대기는 구 카드 디자인임을 확인.
- 공용 AppLoading, 루트/상세 loading.tsx, 목록/검색/추가 로딩 연결 완료. 기존 로고 재사용, 180ms CSS 등장 지연, reduced motion 및 role=status 지원.
- Android 최초 WebView 전용 로컬 오버레이 추가. page commit/finish 시 제거, 연결 오류 시 기존 재시도 대화상자 유지.
- 프론트 lint/build, 단위32개 통과. Android assembleDebug/lintDebug 통과(0 errors, 6 warnings: 기존 deprecated API/아이콘 등).
- 모바일390/PC1280 목록 캡처 및 공용 시작 화면 격리 렌더 캡처 육안 확인. docs/reports/20261019-loading-*.png는 격리 프리뷰이며 실기기 스크린샷이 아님.
- 브라우저 초기 실행은 샌드박스 외부 이미지 요청 EACCES로 중단. 권한 적용 재실행에서 기존 검색1건 및 신규 retry2건 실패. 신규 retry는 SSR 오류 화면과 클라이언트 실패 응답 경합을 피하도록 실제500 응답 대기를 추가해 재검증 중.
- 크롤러/DB 계약 변경 없음. 실기기 검증·웹 배포·APK 릴리즈 업로드 미수행.
- 최종: 실제500 및 검색 응답을 기다리도록 테스트 동기화 후 전체 E2E 9/9 통과(43.3초). 최종 lint 및 diff --check 통과. 웹 로딩 구현·로컬 검증 완료.
- 검증용 APK: android/app/build/outputs/apk/debug/app-debug.apk. 기존 릴리즈1.0.3을 교체하거나 새 릴리즈를 발행하지 않음.
