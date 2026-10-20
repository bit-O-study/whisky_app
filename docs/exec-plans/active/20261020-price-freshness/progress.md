# Progress

- 2026-10-20: 1~6 구현. 단위 42개, E2E 10개(신선도·코스트코 테스트 추가), lint, build, verify-repo(FAIL 0) 통과. 휴대폰 첫 상품 위치 약 700px → 363px.
- 신고 테이블은 DB 비밀번호가 없어 SQL 파일만 준비했다. Supabase SQL 에디터에서 `frontend/supabase/add_liquor_report.sql` 실행 후 최대 5분 안에 버튼이 켜진다.
- 로컬 Windows에는 python3가 없어 verify-repo의 마크다운 링크 검사 단계가 실행되지 않는다(CI 우분투에서는 실행).
