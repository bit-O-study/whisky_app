# 위스키다모아 로고 리뉴얼

사용자 요청: 기존 앱 로고를 고급스럽고 완성도 있게 새로 디자인.
내장 image_gen 도구(imagegen 스킬)로 제작. 자정빛 코발트 배경에 위스키 테이스팅 잔과 금색 W를 결합한 심벌. 원본은 logo-master.png. 웹 헤더/파비콘/Apple 아이콘/Android 적응형 아이콘에 적용. Android 테마 아이콘은 같은 W와 잔 실루엣의 단색 벡터다.

생성 프롬프트: A polished production app icon for Whisky Damoa. No words or typography. Full bleed square canvas. An elegant whisky tasting glass silhouette merged with a flowing W monogram, holding warm amber whisky. Refined sculptural geometry, premium dimensional enamel/metal finish, deep midnight cobalt blue background, amber and champagne gold emblem. Centered within the central 60 percent for circular masks. Readable at 48 pixels. No bottles, scattered sparkles, price tags, tiny ornament, or watermark.

배포 이미지 크기 변환만 sharp로 수행했으며 원본 도안 수정은 하지 않았다. Android 버전 1.0.2(code 3).

검증: 웹 lint/build 및 단위 테스트 32개 통과. Android assembleDebug/lintDebug 성공(0 errors, 6 warnings). APK SHA-256: 5bf6261cf9e508523c77f54e30309def20bf7276b39b8e8e55ccc7c89fb3cd3f.

브라우저 테스트 7개 통과. 로컬 실제 DB 사전 로딩이 fixture 테스트를 오염시키는 문제를 발견해 Playwright 웹 서버만 Supabase 환경변수를 비우도록 격리했다. 운영 앱 환경은 변경하지 않았다. APK 서명 검증 통과, 기존 debug 인증서와 동일. 실제 기기 APK 설치 검증은 수행하지 않았다.

사용자 요청으로 로고 이미지·디자인 의도·적용 위치·검증 결과·가격 검수 결과를 docs/reports/20261015-whisky-review.md 및 HTML에 정리했다.
# README 버전 표기 후속 수정

2026-10-15: 실제 APK와 루트 다운로드 URL은 1.0.2였으나 루트 README 링크 표시 문구와 downloads/README의 버전·해시가 1.0.1로 남아 있었다. 루트/Android/downloads README를 1.0.2로 통일하고 실제 APK SHA-256과 대조했다. 문서 변경이며 APK 재빌드는 필요하지 않다.
