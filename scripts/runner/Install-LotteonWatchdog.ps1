param([Parameter(Mandatory = $true)][string]$RunnerDirectory)
$ErrorActionPreference = 'Stop'
$runner = (Resolve-Path -LiteralPath $RunnerDirectory).Path
if (!(Test-Path -LiteralPath (Join-Path $runner '.runner'))) { throw 'Registered runner directory required' }
$base = Split-Path -Parent $runner
$state = Join-Path $base 'lotteon-daily-state'
New-Item -ItemType Directory -Force -Path $state | Out-Null
foreach ($file in @('Get-LotteonCatchupDecision.ps1', 'Invoke-LotteonDailyWatchdog.ps1', 'Run-LotteonWatchdogTask.ps1')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $base $file) -Force
}
$taskName = 'WhiskyLotteonDailyWatchdog'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Export-ScheduledTask -TaskName $taskName | Set-Content -LiteralPath (Join-Path $state ('task-backup-' + (Get-Date -Format 'yyyyMMddHHmmss') + '.xml')) -Encoding Unicode
}
$account = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$script = Join-Path $base 'Run-LotteonWatchdogTask.ps1'
$action = New-ScheduledTaskAction -Execute 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $script + '" -StateDirectory "' + $state + '"')
$triggers = @(
    (New-ScheduledTaskTrigger -AtLogOn -User $account),
    (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5))
)
$principal = New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Principal $principal -Settings $settings -Force -Description 'Recover missing main Lotteon daily workflow after 09:30 Korea time' | Select-Object TaskName,State
