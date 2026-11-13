param(
    [Parameter(Mandatory = $true)][string]$StateDirectory,
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Get-LotteonCatchupDecision.ps1')
$mutex = New-Object System.Threading.Mutex($false, 'Local\WhiskyLotteonDailyWatchdog')
try { $acquired = $mutex.WaitOne(0) }
catch [System.Threading.AbandonedMutexException] { $acquired = $true }
if (!$acquired) { $mutex.Dispose(); exit 0 }
$previousToken = $env:GH_TOKEN
try {
    $now = [DateTimeOffset]::UtcNow
    $zone = [TimeZoneInfo]::FindSystemTimeZoneById('Korea Standard Time')
    $day = ([TimeZoneInfo]::ConvertTime($now, $zone)).ToString('yyyy-MM-dd')
    New-Item -ItemType Directory -Force -Path $StateDirectory | Out-Null
    $successFile = Join-Path $StateDirectory 'success.json'
    $dispatchFile = Join-Path $StateDirectory 'dispatch.json'
    $success = if (Test-Path -LiteralPath $successFile) { Get-Content -LiteralPath $successFile -Raw | ConvertFrom-Json } else { $null }
    $lastDispatch = if (Test-Path -LiteralPath $dispatchFile) { Get-Content -LiteralPath $dispatchFile -Raw | ConvertFrom-Json } else { $null }
    $decision = Get-LotteonCatchupDecision -Now $now -Success $success -LastDispatch $lastDispatch
    if ($decision.Dispatch) {
        $token = & gh auth token --user ParkSeryu
        if ($LASTEXITCODE -ne 0 -or !$token) { throw 'GitHub CLI account is not available for daily recovery' }
        $env:GH_TOKEN = $token
        $response = (& gh api 'repos/bit-O-study/whisky_app/actions/workflows/lotteon-daily.yml/runs?branch=main&per_page=30') -join [Environment]::NewLine
        if ($LASTEXITCODE -ne 0) { throw 'Cannot verify workflow state; refusing to dispatch blindly' }
        $runs = ($response | ConvertFrom-Json).workflow_runs
        $decision = Get-LotteonCatchupDecision -Now $now -Success $success -Runs @($runs) -LastDispatch $lastDispatch
        if ($decision.Dispatch -and !$DryRun) {
            $inputFile = Join-Path $StateDirectory ('dispatch-' + [guid]::NewGuid().ToString('N') + '.json')
            try {
                [IO.File]::WriteAllText($inputFile, '{"ref":"main","inputs":{"ids":"","limit":"0","dry_run":"false","skip_if_updated":"true"}}')
                & gh api --method POST repos/bit-O-study/whisky_app/actions/workflows/lotteon-daily.yml/dispatches --input $inputFile | Out-Null
                if ($LASTEXITCODE -ne 0) { throw 'Daily recovery dispatch failed' }
            } finally {
                if (Test-Path -LiteralPath $inputFile) { Remove-Item -LiteralPath $inputFile }
            }
            $attempts = if ($lastDispatch -and $lastDispatch.day -eq $day) { [int]$lastDispatch.attempts + 1 } else { 1 }
            [IO.File]::WriteAllText($dispatchFile, (@{ day = $day; attempts = $attempts; requestedAt = $now.ToString('o') } | ConvertTo-Json -Compress))
            $decision.Reason = 'full-main-workflow-dispatched'
        }
    }
    $line = $now.ToString('o') + ' ' + $decision.Reason + ' dryRun=' + $DryRun
    Add-Content -LiteralPath (Join-Path $StateDirectory ('watchdog-' + $day + '.log')) -Value $line
    Write-Output $line
    if ($decision.Reason -eq 'daily-attempt-limit') { exit 1 }
} finally {
    $env:GH_TOKEN = $previousToken
    $token = $null
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
