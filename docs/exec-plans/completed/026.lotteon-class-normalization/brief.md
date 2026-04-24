# 026.lotteon-class-normalization / brief

## 배경
- Lotteon ingest preview는 `liquor_info` 매칭에는 성공했지만 기존 `liquor`를 재사용하지 못해 `insert` 판단이 나왔다.
- 같은 상품이 이미 DB에 있는데 `clazz` 표현 차이만으로 새 마스터를 만들면 카탈로그 중복 위험이 커진다.

## 목표
- 실제 DB 후보를 기준으로 롯데온 preview의 `clazz` 매칭 실패 원인을 확인한다.
- `블랙` ↔ `블랙라벨` 같은 표현 차이를 흡수하도록 preview 정규화를 보강한다.
- 롯데온 preview가 기존 `liquor` 재사용으로 바뀌는지 확인한다.

## 비목표
- 실제 DB write 수행
- Selenium 제거
- 전체 소스 공통 추상화

## 성공 기준
- 조니워커 블랙 라벨 700ml preview 재실행 시 `matchedLiquorId`가 채워지고 `liquorAction`이 `reuse`가 된다.
