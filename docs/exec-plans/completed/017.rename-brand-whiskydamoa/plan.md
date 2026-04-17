# 017.rename-brand-whiskydamoa / plan

1. 관련 가이드 문서와 현재 브랜드 문자열 사용 위치를 확인한다.
2. 현재 사용자 노출 경로(메타데이터, 헤더, 푸터, README, 참고 프로토타입)의 브랜드명을 `위스키다모아`로 치환한다.
3. Playwright 테스트 기대값을 새 브랜드명으로 갱신한다.
4. `rg` 검색과 프론트엔드 검증(`npm run build`, 필요 시 `npm run test:e2e`)으로 누락 여부를 확인한다.
