# 027.preview-safety-gates / brief

## 배경
- ingest preview는 현재 `liquor_info` 매칭과 `reuse/insert/update` 계획은 보여주지만, 어떤 결과를 자동 적재해도 되는지까지는 판단하지 않는다.
- 특히 Lotteon처럼 점수가 낮거나 기존 후보와 충돌하는 경우는 preview 결과만으로는 운영자가 위험도를 빠르게 분류하기 어렵다.

## 목표
- preview 결과에 `confidence`, `reviewNeeded`, `blockReason` 같은 안전장치 판단을 추가한다.
- Emart/Lotteon preview JSON만 보고 자동 적재 가능 여부를 구분할 수 있게 만든다.
- 현재 known risk 사례인 Lotteon 신규 insert를 보수적으로 차단한다.

## 비목표
- 실제 DB write 수행
- Selenium 제거
- 모든 source에 대한 완전한 정책 엔진 구축

## 성공 기준
- Emart preview는 높은 confidence와 자동 적재 가능 판단을 보여준다.
- Lotteon preview는 review 필요 및 block reason을 보여준다.
