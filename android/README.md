# 위스키다모아 Android

현재 배포 버전: **1.0.3** (새 앱 로고 적용). [APK 다운로드](https://github.com/bit-O-study/whisky_app/releases/download/android-v1.0.3/whiskydamoa-1.0.3-debug.apk).

공개 웹 https://whisky-app-vert.vercel.app 에 바로 연결하는 WebView 앱. 주소 입력 화면 없음. 서비스/판매처 링크는 외부 브라우저로 연다. 프로젝트 메모 링크는 웹 서비스로 연결한다. 웹 서버/인터넷이 필요하며 로컬 C안 변경은 웹 배포 후 앱에 반영된다.

JDK 17 이상, Android SDK 36, local.properties sdk.dir 설정 후 Windows에서 gradlew.bat assembleDebug lintDebug 실행.
생성 APK: app/build/outputs/apk/debug/app-debug.apk (개발용 서명, Play Store 배포용 아님).

참고: [Android WebView](https://developer.android.com/develop/ui/views/layout/webapps/webview), [명령줄 빌드](https://developer.android.com/build/building-cmdline).
