# 031.lotteon-batch-operations / brief

## 배경
- 현재 Lotteon은 개별 keyword 기준 preview/ingest는 가능하지만, 운영 관점에서는 `liquor_info` 전체를 기준으로 한 번에 돌리는 batch 실행기가 필요하다.
- 이미 수동으로 전체 keyword batch preview를 실행해봤고, 이 흐름을 재현 가능한 CLI로 정리해야 한다.

## 목표
- `liquor_info` 기반 keyword 자동 생성기를 추가한다.
- Lotteon batch preview/ingest CLI와 summary report를 제공한다.
- batch 실행 결과를 artifact와 summary로 남긴다.

## 비목표
- Emart 운영화
- 전체 source 공통 batch 엔진 완성
- 별도 스케줄러 배포

## 성공 기준
- `npm run preview:lotteon:batch`가 `liquor_info` 기반 전체 keyword preview와 summary를 생성한다.
- `npm run ingest:lotteon:batch`가 safety gate 통과 건만 write하고 summary를 생성한다.
