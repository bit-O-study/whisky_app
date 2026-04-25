# 034.emart-batch-operations / progress

- 2026-04-24 15:46: Emart도 운영 source로 사용하기로 변경되어 batch preview/ingest 경로를 추가하기로 했다.
- 2026-04-24 15:48: `batch-preview-emart.ts`, `batch-ingest-emart.ts`를 추가하고 package script에 `preview:emart:batch`, `ingest:emart:batch`를 등록했다.
- 2026-04-24 15:49: Emart 공개 검색 fallback 위험을 고려해 Emart 신규 `liquor` insert는 `emart_new_insert_requires_review`로 자동 차단하도록 safety gate를 보강했다.
- 2026-04-24 15:49: `npm run build` 통과를 확인했다.
- 2026-04-24 15:49: `npm run preview:emart:batch`를 실행해 22개 keyword 기준 `matched=4`, `autoWriteAllowed=4`, `reviewNeeded=18`을 확인했다.
- 2026-04-24 15:52: `npm run ingest:emart:batch`를 실행해 safety gate 통과 4건만 실제 write되고 18건은 차단됨을 확인했다.
- 2026-04-24 15:53: `bash scripts/verify-repo.sh` 통과를 확인했다.
- 2026-04-24 15:53: Emart batch ingest write 결과는 조니워커 블루라벨(863), 조니워커 블랙루비(864), 산토리 가쿠빈(871), 버팔로 트레이스(875) 4건이며 나머지 18건은 후보 없음으로 차단됐다.
