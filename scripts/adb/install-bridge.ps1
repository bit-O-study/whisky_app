param([Parameter(Mandatory=$true)][string]$AdbPath)
$ErrorActionPreference = 'Stop'
$adb = (Resolve-Path -LiteralPath $AdbPath).Path
$name = 'Whisky-ADB-Bridge'
if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) { throw 'Task already exists; inspect before updating.' }
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute $adb -Argument '-L tcp:localhost:5037 server nodaemon'
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings $settings -Trigger $trigger | Select-Object TaskName,State
Start-ScheduledTask -TaskName $name
