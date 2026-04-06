# PLANS

## 운영 규칙
- 진행 중 작업은 `docs/exec-plans/active/<slug>/`에 둔다.
- 완료된 작업은 `docs/exec-plans/completed/<slug>/`로 옮긴다.
- 각 작업 폴더의 기본 파일은 `brief.md`, `plan.md`, `progress.md`다.
- 장기 가치가 남는 내용만 `product-specs/`, `design-docs/`, 루트 문서로 승격한다.

## 폴더 의미
- `active/`
  현재 진행 중인 실행 계획
- `completed/`
  완료된 작업의 실행 기록 보관소
- `tech-debt-tracker.md`
  즉시 처리하지 못한 리스크와 후속 작업

## 마이그레이션 원칙
- 예전 `docs/issues/*` 형식 문서는 완료 보관소와 내구 문서로 분해해 옮긴다.
- 실행 기록과 장기 설계 문서를 같은 폴더에 섞지 않는다.
