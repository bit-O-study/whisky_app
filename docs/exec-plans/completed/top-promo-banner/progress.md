# 완료 기록

- 변경 분류: UI / Interaction.
- 광고를 목록 하단에서 헤더 바로 아래로 이동.
- 헬쑤 배너의 이미지 배경, 검은 오버레이, 작은 모서리, 밑줄 CTA, 직접 선택 버튼 적용.
- IQ 사진과 헬쑤 앱 아이콘은 로컬 health_app/public 자산 재사용.
- 4.5초 자동 전환 유지, prefers-reduced-motion 설정 시 자동 전환 중지.
- npm run lint: 오류 없음, 기존 initialPage.size Hook 의존성 경고 1개.
- npm run build: 통과.
- npm run test: 5개 파일, 22개 테스트 통과.
- E2E: 기본 Chromium 버전 미설치로 시작 불가. 설치된 Edge를 사용하는 임시 설정으로 실행하여 4개 통과, 무한 스크롤 1개 시간 초과. 실패 테스트 단독 재실행 통과.
- 1440×1000 / 390×844에서 상단 배치, 두 이미지 로딩, 배너 선택, 가로 넘침 없음 확인. screenshots/에 화면 기록.
- 로컬 Supabase 환경변수 미설정으로 스크린샷에 실제 상품 데이터는 없음. 개발 서버의 Google Fonts 다운로드 경고로 대체 폰트 사용.
- git diff --check 통과. 배포는 수행하지 않음.
