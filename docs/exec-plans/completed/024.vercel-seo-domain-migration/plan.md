# 024.vercel-seo-domain-migration / plan

## 상태 규칙
- `[ ]` 미착수
- `[-]` 진행 중
- `[x]` 완료

## 접근 방향
- 새 도메인은 코드에 직접 쓰지 않고 환경변수로 주입한다.
- 로컬/미설정 환경에서는 기존 Vercel URL을 fallback으로 유지해 빌드가 깨지지 않게 한다.
- SEO URL 정규화는 재사용 가능한 순수 함수로 분리하고 단위 테스트로 잠근다.

## 작업 단계
- [x] Phase 1. 조사와 범위 확정
- [x] Phase 2. 구현
- [x] Phase 3. 검증과 문서 정리

## 검증
- `npm run lint`
- `npm run test`
- `npm run build`

## 리스크
- 실제 대표 도메인은 Vercel 환경변수 `NEXT_PUBLIC_SITE_URL` 또는 `SITE_URL`에 배포 환경별로 설정해야 한다.
- 이전 도메인에서 새 도메인으로의 301 redirect는 Vercel 프로젝트/도메인 설정 상태에 따라 별도 확인이 필요하다.
- `npm install` 중 npm audit 기준 9개 취약점이 보고되었으나 이번 SEO 도메인 변경 범위 밖이다.
