param([Parameter(Mandatory=$true)][string]$AdbPath, [string]$Serial = '', [string]$EnvFile = '', [string]$DailyAt = '04:00', [switch]$Apply, [switch]$RunElevated)
$ErrorActionPreference = 'Stop'
$adb = (Resolve-Path -LiteralPath $AdbPath).Path
$node = (Get-Command node.exe -ErrorAction Stop).Source
$script = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'automate.mjs')).Path
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
if ($Serial -and $Serial -notmatch '^[a-zA-Z0-9.:_-]+$') { throw 'Invalid serial' }
$name = 'Whisky-ADB-Price-Refresh'
if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) { throw 'Task already exists; inspect it before updating.' }
# Task action uses a local wrapper; credentials stay in frontend/.env.local.
$dir = Join-Path $repo 'artifacts/adb/automation'
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$wrapper = Join-Path $dir 'scheduled-run.ps1'
function Quote-Literal([string]$value) { return "'" + $value.Replace("'", "''") + "'" }
$lines = @('$ErrorActionPreference = ''Stop''', ('$env:ADB_PATH = ' + (Quote-Literal $adb)),
  ('$env:WHISKY_ENV_FILE = ' + (Quote-Literal $EnvFile)),
  ('$env:ADB_SERIAL = ' + (Quote-Literal $Serial)), ('Set-Location -LiteralPath ' + (Quote-Literal $repo)),
  ('& ' + (Quote-Literal $node) + ' ' + (Quote-Literal $script) + $(if ($Apply) { ' --apply' } else { '' })), 'exit $LASTEXITCODE')
[IO.File]::WriteAllLines($wrapper, $lines, (New-Object Text.UTF8Encoding($true)))
$action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $wrapper + '"') -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$korea = [TimeZoneInfo]::FindSystemTimeZoneById('Korea Standard Time')
$koreanDay = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $korea).ToString('yyyy-MM-dd')
$koreanStart = [DateTime]::SpecifyKind([DateTime]::ParseExact(($koreanDay + ' ' + $DailyAt), 'yyyy-MM-dd HH:mm', [Globalization.CultureInfo]::InvariantCulture), [DateTimeKind]::Unspecified)
$startUtc = [TimeZoneInfo]::ConvertTimeToUtc($koreanStart, $korea)
if ($startUtc -le [DateTime]::UtcNow) { $startUtc = $startUtc.AddDays(1) }
$trigger.StartBoundary = $startUtc.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$level = if ($RunElevated) { 'Highest' } else { 'Limited' }
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel $level
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Refresh registered Winegrab links; strict identity and price validation; logs under artifacts/adb/automation.' | Select-Object TaskName,State
