# 진행
- MainActivity의 progressBarStyleHorizontal이 상단 진행바의 원인임을 확인.
- 가로 진행바와 로고 시작 화면 제거, 중앙 원형 버퍼링 및 180ms 지연 표시 반영.
- JDK21 gradlew :app:assembleDebug :app:lintDebug 통과. APK: android/app/build/outputs/apk/debug/app-debug.apk. 실기기 검증과 릴리즈 업로드는 미수행.
- Android 코드만 변경했으므로 웹 테스트는 재실행하지 않음. 상단 바 제거는 새 APK 설치 후 반영된다.
