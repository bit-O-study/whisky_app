# 032.buffalo-empty-class-normalization / brief

## 배경
- Lotteon batch에서 `버팔로 트레이스 750ml`는 score는 충분히 높지만 기존 DB 후보와 `clazz` 빈값 처리 차이 때문에 `conflicting_existing_candidates`로 차단됐다.
- 현재 신규 후보는 `clazz=None`, 기존 row는 빈 문자열 `""`로 저장돼 있어, 사실상 같은 상품인데도 새 insert 후보로 보인다.

## 목표
- preview/ingest 정규화에서 `None`, 빈 문자열, 공백 class를 동일한 empty class로 취급한다.
- `버팔로 트레이스 750ml`가 기존 `liquor.id=875`를 재사용하도록 바꾼다.

## 비목표
- 전체 safety gate 재설계
- 다른 source 전체 재검증

## 성공 기준
- `npm run preview:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1` 결과에서 `matchedLiquorId=875`, `liquorAction=reuse`가 된다.
- `npm run ingest:lotteon -- --keyword "버팔로 트레이스 750ml" --limit 1`가 차단 없이 진행된다.
