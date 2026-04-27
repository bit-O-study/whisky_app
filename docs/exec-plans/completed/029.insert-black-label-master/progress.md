# 029.insert-black-label-master / progress

- 2026-04-24 15:37: 사용자가 `조니워커 블랙 라벨` master row를 먼저 넣는 방향으로 진행을 요청했고, insert 후 Lotteon 재검증까지 이번 범위로 확정했다.
- 2026-04-24 15:41: `liquor_info(id=212)`와 기존 `brand=조니워커`, `volume_ml=700` liquor 후보를 확인한 결과 `블랙루비(id=864)`, `블론드(id=865)`만 있고 `블랙라벨` master는 없음을 재확인했다.
- 2026-04-24 15:45: Supabase REST로 `조니워커 블랙 라벨 700ml` canonical master row를 insert했고 새 liquor id `880`이 생성되었다. 입력값은 `normalized_name=조니워커 블랙 라벨`, `class=블랙라벨`, `product_code=MANUAL_JOHNNIE_WALKER_BLACK_LABEL_700ML`, `liquor_info_id=212`다.
- 2026-04-24 15:46: Lotteon preview 재실행 결과 `matchedLiquorId=880`, `liquorAction=reuse`로 바뀌어 master 재사용 경로가 정상 작동함을 확인했다.
- 2026-04-24 15:46: Lotteon ingest 재실행 결과도 `liquorId=880`를 가리켰지만, safety gate가 여전히 `low_score:48`로 차단해 실제 price/url write는 수행되지 않았다.
