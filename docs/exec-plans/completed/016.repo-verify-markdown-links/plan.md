# Plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 저장소 Markdown 링크 패턴을 먼저 샘플링한 뒤, shell 기반 검증으로 처리 가능한 범위(상대/절대 repo 경로/anchor)를 스크립트에 추가한다.
- 외부 URL과 mailto 같은 비저장소 링크는 건너뛴다.

## 작업 단계
- [x] Phase 1. 조사와 범위 확정
- [x] Phase 2. 구현
- [x] Phase 3. 검증과 문서 정리

## 검증
- `bash -n scripts/verify-repo.sh`
- `bash scripts/verify-repo.sh`

## 리스크
- Markdown 파싱을 정규식 기반으로 처리하므로 특수 케이스가 남을 수 있다.
- anchor 판정은 문서의 실제 렌더러와 100% 동일하지 않을 수 있다.
