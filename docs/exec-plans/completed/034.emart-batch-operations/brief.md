# 034.emart-batch-operations / brief

## 배경
- Emart도 Playwright 운영 경로에서 사용하기로 했다.
- 다만 공개 검색 surface가 불안정해 전체 자동 insert는 위험하므로 Lotteon과 동일한 batch preview/ingest 흐름에 더 보수적인 safety gate를 적용한다.

## 목표
- `liquor_info` 기반 Emart batch preview/ingest CLI를 제공한다.
- batch summary JSON/Markdown을 생성한다.
- Emart 신규 `liquor` insert는 review 대상으로 차단하고, 기존 `liquor` reuse/update 중심으로 운영한다.

## 비목표
- Emart 공개 검색 surface를 추가로 우회/탐색
- Selenium 런타임 제거
- Emart 성공률 자체의 대폭 개선

## 성공 기준
- `npm run preview:emart:batch`가 전체 keyword preview와 summary를 생성한다.
- `npm run ingest:emart:batch`는 safety gate 통과 건만 write 가능하다.
- `npm run build`와 repo verify가 통과한다.
