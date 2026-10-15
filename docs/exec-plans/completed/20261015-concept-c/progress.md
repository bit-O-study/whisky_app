# 진행
완료: C안 화이트/블루 목록, PC 사이드바/모바일 필터, 판매처 표 펼침, 용량/도수/수집 시각, 한국어 판매처명. 검색/상세 링크/추천 진입/추가 로딩 유지. 첫 검색 debounce가 완료된 목록의 hasNext를 다시 켜던 문제도 수정했다.

함께하는 서비스는 IQ 검사/헬쑤/프로젝트 메모를 항상 표시한다. 사용자 요청대로 프로젝트 메모는 https://meeting-minutes-orcin.vercel.app 웹 연결이며 다운로드가 아니다.

외부 Google 폰트 로더 의존을 제거하고 시스템 폰트 사용. 기존 폰트 빌드 오류 해결.

검증:
- ESLint 전체 통과, webpack 프로덕션 빌드/TypeScript 통과.
- Vitest 7개 파일, 31개 테스트 통과.
- Playwright 기존 흐름 + C 모바일 필터/가격표/메모 링크 + 첫 페이지 중복 요청 회귀 총 7개 통과. 로컬 production 3001 서버, Edge 채널 설정으로 실행.
- 1440/390/360 화면 가로 넘침 없음, pageerror 없음. screenshots/*-fixture.png는 API를 브라우저에서 가로챈 예시 데이터 화면이며 실제 상품/가격의 증거가 아니다. 제품 코드에 fixture 삽입 없음.
- Android assembleDebug/lintDebug 통과 (0 errors, 3 warnings: API 속성 호환성, 필수 JavaScript 설정, 백업 속성). API 33+ 플랫폼 뒤로 가기 콜백 등록, 이전 버전용 onBackPressed는 해당 lint 항목만 사유와 함께 suppress.
- APK v2 서명 검증, 패키지 kr.bito.whiskydamoa/1.0.0, minSdk 26 확인. 다운로드 HTTP 200. 실제 기기 설치/실행은 수행하지 않음.

산출물: frontend/public/downloads/whiskydamoa-1.0.0-debug.apk. SHA256 A279BA01B373C0579C75A9655074BB7CE776DEE501DB91902F785D189B0CBADA.

제한: 로컬 Supabase 서버 환경변수가 없어 실제 DB 목록은 확인 불가. 웹 배포/푸시는 수행하지 않았다. APK는 공개 웹 https://whisky-app-vert.vercel.app 을 열기 때문에 C안/서비스 링크 변경은 웹 배포 후 앱에 반영된다. 3001은 완성된 production 빌드로 실행 중이다.
