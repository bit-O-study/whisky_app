param([Parameter(Mandatory = $true)][string]$StateDirectory)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $StateDirectory | Out-Null
$log = Join-Path $StateDirectory 'task-launch.log'
try {
    Add-Content -LiteralPath $log -Encoding utf8 -Value ((Get-Date -Format o) + ' started user=' + [Security.Principal.WindowsIdentity]::GetCurrent().Name)
    & (Join-Path $PSScriptRoot 'Invoke-LotteonDailyWatchdog.ps1') -StateDirectory $StateDirectory
    Add-Content -LiteralPath $log -Encoding utf8 -Value ((Get-Date -Format o) + ' finished')
} catch {
    $message = $_.Exception.Message
    if ($message.Length -gt 300) { $message = $message.Substring(0, 300) + '...' }
    Add-Content -LiteralPath $log -Encoding utf8 -Value ((Get-Date -Format o) + ' failed: ' + $message)
    exit 1
}
