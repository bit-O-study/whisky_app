# ADB 앱 가격 수집 계획

사용자 요청: 위스키 프로젝트에 ADB 기반 크롤링 계획 수립. 현재 범위는 계획뿐이며 기기 조작·수집·DB 적재는 시작하지 않는다.

목표: 앱에서 표시되는 상품·가격·조건을 근거와 함께 추출하고 기존 preview/검증/적재 경로로 연결한다.
미확정: 첫 대상 앱/패키지·우선순위, 기기, 매장/지역, 일반가와 회원가 표시 정책. 사용자에게 대상 앱을 질문한 상태다.
현황: Selenium 및 backend/crawler-playwright가 존재. 후자는 EMART/LOTTEON 수집, ingest-preview, safety-gates, ingest-write를 구현했다. 로컬 위스키 DB 환경변수는 현재 없다.
