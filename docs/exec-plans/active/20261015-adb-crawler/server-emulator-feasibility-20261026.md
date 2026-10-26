# 서버 이마트 앱 배치 수집 가능성 평가

2026-10-26. Change class: Crawler / Write Path 실행 계획 보완. 기존 ADB 및 20261023-data-pipeline-hardening 계획을 검토했다. 코드·서버·DB 변경 없이 판단과 후속 절차를 기록한다.

## 결론

**배치 자동화는 조건부 가능하지만 현 서버에서 즉시 무인 운영할 준비는 안 되어 있다.** 전용 USB Android 실기기를 우선 권장한다. 가상화 설정 변경 없이 기존 실기기 검증 경로를 재사용하고 서버 메모리 부담을 줄일 수 있다. 서버 연결·디버깅 승인·잠금·로그인 유지 검증은 여전히 필요하다.

실기기를 둘 수 없다면 BIOS 가상화를 켠 뒤 에뮬레이터 하나만 파일럿한다. 공식 Android Emulator를 유지보수 기준의 첫 후보로, Nox를 앱 호환성 비교 후보로 둔다. 이마트 앱 설치/ABI/로그인/와인그랩 화면/UI XML/공유 링크의 에뮬레이터 호환성은 아직 확인하지 않았다. 보안 차단 우회는 설계에 포함하지 않는다.

## 서버 근거와 한계

수치는 같은 작업에서 부모 에이전트가 수행한 읽기 진단 전달값이다. 이 문서 작업에서 원격 진단을 다시 실행하지 않았다.

| 항목 | 확인값 / 의미 |
| --- | --- |
| OS / CPU | Windows 11 Home / i3-9100, 4코어 4스레드 |
| 메모리 | 총 8,252,748 KiB(약 7.87 GiB), 당시 여유 3,299,260 KiB(약 3.15 GiB) |
| 디스크 / GPU | C 여유 84,237,836,288 bytes(약 78.45 GiB), UHD 630 + GT 1030 |
| 가상화 | WMI VirtualizationFirmwareEnabled=false, SLAT=false. HypervisorPlatform/VirtualMachinePlatform Disabled |
| 세션 | explorer 1개. 잠금/로그아웃/원격 세션 종료 후 앱 동작을 보장하지 않음 |
| 설치 상태 | 에뮬레이터/ADB 설치 경로와 버전 미확정 |

i3-9100은 [Intel 공식 사양](https://www.intel.com/content/www/us/en/products/sku/134870/intel-core-i39100-processor-6m-cache-up-to-4-20-ghz/specifications.html)에서 VT-x/EPT 지원으로 표시된다. WMI false를 물리 CPU 기능 부재로 단정하지 않는다. BIOS와 실제 하이퍼바이저 가용성을 재확인한다.

공식 Emulator는 Windows에서 WHPX를 권장하고 BIOS VT-x와 EPT 등을 요구한다. 활성화 후 재부팅이 필요할 수 있다. AEHD는 2026-12-31 종료 예정이므로 신규 운영의 기본으로 선정하지 않는다. [Android 공식 가속 문서](https://developer.android.com/studio/run/emulator-acceleration)

Nox는 CLI로 인스턴스 시작/종료, 앱 설치/실행, ADB 호출, CPU/메모리 설정을 제공한다. 이는 배치 연결 가능성의 근거이며 이마트 호환성이나 무인 운영 성공의 근거는 아니다. [Nox 공식 CLI](https://support.bignox.com/en/function/command)

## 선택과 자원

| 경로 | 장점 | 선행 조건 / 미검증 사항 | 판단 |
| --- | --- | --- | --- |
| USB 실기기 | 기존 Galaxy S23/이마트 5.2.9 표본 수집 이력, 서버 부담 감소 | 서버 USB, 디버깅 승인, 충전·잠금·로그인, 재연결 | 우선 권장 |
| 공식 Emulator | SDK/ADB 통합, 가속 진단 | BIOS/WHPX/재부팅, 앱 설치/ABI/Play 호환, RAM/CPU와 화면 파싱 | 조건부 파일럿 |
| Nox | CLI 제어 | 버전별 Android/ABI/하이퍼바이저 공존, GUI 세션, 앱 보안·파싱 | 대안 파일럿 |

현재 가용 메모리에서 게스트 2 GiB만 배정해도 호스트 부대비용과 기존 웹/DB/CI 여유가 작다. RAM 16 GiB 증설은 운영 여유를 위한 제안이며 앱 호환성 해결/성공 보장이 아니다. 설치 최소사양과 공용 서버의 운영 여유를 구별하고 비업무 시간에 경합을 실측한다.

## 2026-10-26 RAM 추가 질문 후 확인

부모 에이전트의 읽기 전용 실측 전달값과 공식 사양을 추가 대조했다. 이 문서 갱신에서는 원격 진단을 다시 실행하지 않았다.

| 항목 | 실측값 |
| --- | --- |
| 시스템 모델 | Lenovo `10SQS1HQ00` — ThinkCentre M720t, 머신 타입 `10SQ` |
| 장착 메모리 | 8GB 1개, Kingston `LV26D4U9S8HJ-8` |
| 속도 | `Speed=2667`, `ConfiguredClockSpeed=2400` |
| 규격 식별 | `SMBIOSMemoryType=26`, `FormFactor=8`, `DataWidth=64`, `TotalWidth=64` |
| 메모리 어레이 | `MemoryDevices=4`, `MaxCapacity=67108864 KiB`(64 GiB) |

[Lenovo M720 Tower 공식 사양](https://psref.lenovo.com/syspool/Sys/PDF/ThinkCentre/ThinkCentre_M720_Tower/ThinkCentre_M720_Tower_Spec.html)은 DDR4-2666, DIMM 슬롯 4개, 최대 64GB를 명시한다. 부모가 확인한 [Lenovo PSREF PDF](https://psref.lenovo.com/syspool/Sys/i_pdf/psref568.pdf)의 UDIMM/non-ECC 규격도 함께 근거로 남긴다. HTML 사양의 i3-9100 메모리 지원은 DDR4-2400이므로, 모듈 표시 속도 2667과 실제 설정 속도 2400은 구별한다.

따라서 **호환되는 데스크톱용 DDR4 UDIMM non-ECC 8GB를 추가해 총 16GB로 구성하는 것은 슬롯·용량 기준으로 가능하다.** 장착 전 실제 빈 슬롯과 슬롯 배치, 추가 모듈 규격을 확인하고 장착 후 BIOS/Windows 인식 및 메모리 안정성을 검증한다. 현재 장착 또는 증설 후 부하 시험을 완료한 상태는 아니다.

16GB 구성에서는 에뮬레이터 한 개를 사용하는 배치 파일럿이 더 현실적이라는 판단이다. 다만 RAM 증설만으로 무인 수집 준비가 끝나지는 않는다. BIOS VT/가속 활성화, 이마트 앱 설치·로그인·화면 파싱 호환성, 기존 웹·DB·CI 서비스와 동시 실행할 때의 CPU/메모리/응답시간 검증이 남아 있다. 이번 후속 확인에서도 설치·실수집·DB 반영은 실행하지 않았다.

## 기존 구현의 재사용 범위

- `collect.mjs`: `--adb`, `--serial`, `--sources`, `--max-pages`, `--out`, `--resume`, `--links`, 체크포인트/기기 잠금 지원. resume는 결과를 유지한 처음부터 재순회이며 화면 위치 복원이 아니다.
- 잠금은 `os.tmpdir()` 아래 serial 해시 파일이므로 다른 Windows 계정/TEMP까지 전역 잠금을 보장하지 않는다. 운영 계정 하나와 스케줄러 단일 인스턴스를 고정하고 추후 공용 잠금 경로/named mutex를 보강한다.
- `refresh-links.mjs`는 개발 기기 serial 하드코딩이 남아 있다. 서버 배치 전 serial/ADB 인자 통일과 잘못된 기기 차단 검증이 필요하다.
- 전체 링크 수집은 2026-10-15에 카테고리 인식 오류로 중단됐다(EMART 30개/29링크, TRADERS 미시작). `stalled_or_end`/`page_limit`는 전체 완료가 아니다.
- 목록은 검토용이다. 수집 exit 0은 DB 반영 성공이 아니다. 20261023 파이프라인 보강에는 미커밋 변경과 미완료 계획이 있으므로 자동 적재 준비가 끝났다고 간주하지 않는다.

## 읽기 전용 사전진단

다음은 서버에서 수행할 진단 예시이며 이번 평가에서는 실행하지 않았다. 설치/앱 실행/화면 조작/스케줄 등록을 포함하지 않는다. 기능 조회에 권한이 없으면 Disabled로 해석하지 않는다.

```powershell
Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,VirtualizationFirmwareEnabled,SecondLevelAddressTranslationExtensions
Get-CimInstance Win32_OperatingSystem | Select-Object Caption,TotalVisibleMemorySize,FreePhysicalMemory
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID,FreeSpace,Size
Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion
Get-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform | Select-Object FeatureName,State
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform | Select-Object FeatureName,State
Get-Command adb.exe,emulator.exe,NoxConsole.exe -ErrorAction SilentlyContinue | Select-Object Name,Source
Get-Process -Name Nox,NoxVMHandle,emulator,qemu-system-x86_64,explorer -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,WorkingSet64
Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*','HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object DisplayName -Match 'Nox|Android Studio|Android SDK' | Select-Object DisplayName,DisplayVersion,InstallLocation
```

PATH/레지스트리에서 안 보이는 portable/custom 설치도 가능하다. Win32_Product 조회는 설치 복구를 유발할 수 있어 사용하지 않는다. SDK가 있으면 `emulator.exe -accel-check`로 가속 사용 가능 여부를 확인한다. ADB 조회는 daemon을 시작할 수 있으므로 순수 호스트 진단과 분리한다.

## 수집하지 않는 배치 dry-run

아래는 명령 인자 출력만 수행한다. `collect.mjs` 자체에는 `--dry-run`이 없다. 실제 호출하면 기기 화면을 조작한다.

```powershell
$pilotAdb = 'C:\Android\platform-tools\adb.exe'
$pilotSerial = 'REPLACE_WITH_VERIFIED_SERIAL'
$pilotOut = 'artifacts/adb/server-pilot-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$pilotArgs = @('scripts/adb/collect.mjs','--adb',$pilotAdb,'--serial',$pilotSerial,'--sources','EMART','--max-pages','4','--out',$pilotOut)
[pscustomobject]@{Executable='node';Arguments=$pilotArgs;Mode='PLAN_ONLY';DbWrite=$false} | ConvertTo-Json -Depth 3
```

## 파일럿과 스케줄 설계

1. 필요 시 BIOS/설치/재부팅 작업시간을 정한다. 이번 요청은 가능성 평가이므로 실행하지 않았다. 사용자 로그인·성인확인·점포선택을 완료하고 ADB를 외부에 노출하지 않는다.
2. 기기 1대/운영 계정 1개로 제한한다. 에뮬레이터 2 vCPU/2 GiB는 초기 시험값이며 부족하면 공용 서버에서 무작정 상향하지 않고 증설/별도 기기로 전환한다.
3. 앱 버전·패키지·해상도·serial·source/채널/점포를 실행 메타데이터에 기록한다. EMART 4화면 및 링크 2~5개를 화면과 대조하고 다음에 TRADERS를 따로 검증한다. DB에는 쓰지 않는다.
4. 30분 부하/3회 반복 실행, USB 재연결, 앱 재시작, 잠금/원격 세션 종료를 시험한다. 기존 서비스 응답·CPU·가용 RAM을 기록한다. RAM 1 GiB 미만 또는 기존 서비스 장애 시 중단은 제안 기준이며 실측 후 확정한다.
5. 통과 후 비업무 시간 하루 1회부터 스케줄한다. 절대 Node/ADB 경로, 작업 디렉터리, 전용 계정, `새 인스턴스를 시작하지 않음`, 제한시간, 로그 경로를 고정한다. GUI가 필요한 Nox는 로그인 사용자 세션에서 먼저 검증한다. 자동 로그인을 기본으로 강제하지 않는다. 로그아웃 상태 운영은 별도 합격 항목이다.
6. 외부 재시도는 일시적 ADB 오류에 최대 1회만 허용한다. 로그인·파싱 오류는 `needs_user_action`으로 중단한다. 4화면 파일럿은 10분 제한부터 시작하고 전체 제한시간은 실측으로 정한다.
7. 취소 시 정상 종료/체크포인트 시간을 먼저 준다. 강제 종료 후 잠금은 PID뿐 아니라 시작시각/실행 ID까지 확인해 해제한다. 불확실한 잠금을 자동 삭제하지 않는다. 재개만 동일 출력 폴더를 사용하고 새 관측은 새 폴더를 쓴다.
8. `last_attempt_at`, `last_observed_at`, `last_successful_ingest_at`를 분리하고 부분 수집/인증 필요/검토 대기/반영 완료를 구별한다. 실패한 날 신선도 시각을 갱신하지 않는다.

## DB 반영 전 검수

- `TRADERS`와 DB `EMART_TRADERS`를 명시적으로 매핑하고 EMART/SSG 웹/앱/점포 가격을 섞지 않는다.
- URL/상품 ID·용량·숙성·에디션·구성을 대조한다. 카드/회원/쿠폰 가격을 일반가로 쓰지 않는다.
- 0/null, 24시간 이상 관측, 40% 초과 변동, 오연결·픽업 불가·조건 불명은 검토로 보낸다. 실패로 정상 가격을 삭제/0원 덮어쓰기 하지 않는다.
- UTC 관측시각, 스냅샷/이력, 재실행 중복 방지, 조건부 갱신 충돌과 영수증을 검증한다. 20261023 보강 검증 전에 자동 적재를 켜지 않는다.
- 원본 캡처/XML은 Git 제외 산출물에 접근 제한한다. 수집-only 파일럿에 DB 쓰기 키는 필요 없다.

## 완료 상태

문서/코드 및 공식 자료 검토, 서버 수치 평가, 배치·복구·검수 설계 완료. 설치·서버 변경·실수집·DB 반영·스케줄 등록은 0건이다. 다음 순서는 설치 상태 확인 → 기기 선택 → 필요 시 가상화 설정/설치 → 사용자 로그인 → 표본 실측 → 운영 스케줄이다. BIOS/로그인은 사용자 또는 현장 조작이 필요할 수 있다.
