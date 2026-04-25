# 033.fix-lagavulin-master-name / progress

- 2026-04-24 16:22: 사용자 요청에 따라 라가불린 master row의 프로모션 문구가 포함된 `product_name`만 canonical 이름으로 수정하기로 했다.
- 2026-04-24 16:23: 수정 전 `liquor.id=870` 조회 결과 `product_name="[2개 30%] 라가불린 16년 (700ML)"`임을 확인했고, preview에서도 같은 값이 existing candidate로 노출됨을 재확인했다.
- 2026-04-24 16:24: Supabase REST patch로 `liquor.id=870`의 `product_name`을 `라가불린 16년 (700ML)`로 수정하고 `updated_at`을 현재 시각으로 갱신했다.
- 2026-04-24 16:25: patch 후 동일 row 조회와 Lotteon preview 재실행 결과 모두 canonical `product_name="라가불린 16년 (700ML)"`로 보이는 것을 확인했다.
