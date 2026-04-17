# Brief

## 문제
- `scripts/verify-repo.sh`가 현재 필수 파일, exec plan 구조, 번호 중복만 검사하고 있어 Markdown 링크 깨짐은 자동으로 잡지 못한다.
- 이 저장소는 문서 기반 하네스 비중이 높으므로 링크 드리프트를 조기에 잡는 검증이 필요하다.

## 목표
- `scripts/verify-repo.sh`에 저장소 내부 Markdown 링크 유효성 검사를 추가한다.
- 저장소 문서가 사용하는 링크 패턴(상대 경로, 절대 repo 경로, anchor, 외부 URL)을 지원한다.
- 관련 repo harness 문서에 새 검증 표면을 반영한다.

## 비목표
- 외부 웹 링크의 네트워크 유효성 검사
- 이미지 렌더링/콘텐츠 품질 검사
- 백엔드/프론트 기능 테스트 확장

## 성공 기준
- Markdown 문서의 내부 파일 링크와 anchor 링크가 `bash scripts/verify-repo.sh`에서 검증된다.
- 기존 저장소 문서들이 새 검사 기준에서 통과한다.
- 관련 문서와 실행 기록이 갱신된다.

## 관련 문서
- `docs/REPOSITORY.md`
- `docs/CHANGE_POLICY.md`
- `docs/QUALITY_SCORE.md`
- `README.md`
