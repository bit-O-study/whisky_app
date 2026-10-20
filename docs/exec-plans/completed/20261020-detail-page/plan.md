# Plan

1. 표시 규칙을 `src/features/catalog/model/liquor-detail.ts` 순수 함수로 분리하고 Vitest로 고정한다(브랜드/분류·원산지 이어 붙이기, 이름 끝 용량 정리, 0원 제외 정렬, 코스트코 대체 판매처, 오래된 가격, 주소 번호 검사).
2. `LiquorDetailView` — 한글 라벨, 빈 값 숨김, 가격 없음 안내, 판매처 행 넘침 수정, 오래된 가격 배지, 사진 없음 자리표시, 모바일 제목·여백 축소.
3. `PriceTrendChart` — 기록 2개 미만이면 한 줄 안내.
4. `app/liquor/[id]` — 주소 검사 후 `notFound()`, 없는 상품 404 오류, `not-found.tsx`, 다시 시도 화면.
5. `globals.css` — `word-break: keep-all`.
6. 실제 DB로 dev 서버를 띄워 115개 전수 재점검 후 커밋. 푸시는 사용자 확인 후.
