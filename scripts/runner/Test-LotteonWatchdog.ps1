$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Get-LotteonCatchupDecision.ps1')
$now = [DateTimeOffset]'2026-11-13T01:00:00Z'
$cases = @(
    @{ Name = 'before due time'; Now = '2026-11-13T00:20:00Z'; Expected = 'before-09:30' },
    @{ Name = 'missing today'; Expected = 'daily-update-missing' },
    @{ Name = 'successful full receipt'; Success = @{ completedAt = '2026-11-13T00:01:00Z' }; Expected = 'already-updated-today' },
    @{ Name = 'old receipt'; Success = @{ completedAt = '2026-11-12T01:00:00Z' }; Expected = 'daily-update-missing' },
    @{ Name = 'queued workflow'; Runs = @(@{event='workflow_dispatch';status='queued'}); Expected = 'workflow-already-active' },
    @{ Name = 'successful schedule'; Runs = @(@{event='schedule';status='completed';conclusion='success';updated_at='2026-11-13T00:50:00Z'}); Expected = 'scheduled-update-succeeded' },
    @{ Name = 'cancelled schedule'; Runs = @(@{event='schedule';status='completed';conclusion='cancelled';updated_at='2026-11-13T00:50:00Z'}); Expected = 'daily-update-missing' },
    @{ Name = 'manual sample is not full receipt'; Runs = @(@{event='workflow_dispatch';status='completed';conclusion='success';updated_at='2026-11-13T00:50:00Z'}); Expected = 'daily-update-missing' },
    @{ Name = 'cooldown'; LastDispatch = @{day='2026-11-13';attempts=1;requestedAt='2026-11-13T00:55:00Z'}; Expected = 'dispatch-cooldown' },
    @{ Name = 'attempt limit'; LastDispatch = @{day='2026-11-13';attempts=3;requestedAt='2026-11-13T00:30:00Z'}; Expected = 'daily-attempt-limit' },
    @{ Name = 'next day resets attempts'; LastDispatch = @{day='2026-11-12';attempts=3;requestedAt='2026-11-12T00:30:00Z'}; Expected = 'daily-update-missing' }
)
foreach ($case in $cases) {
    $when = if ($case.Now) { [DateTimeOffset]$case.Now } else { $now }
    $result = Get-LotteonCatchupDecision -Now $when -Success $case.Success -Runs @($case.Runs) -LastDispatch $case.LastDispatch
    if ($result.Reason -ne $case.Expected -or $result.Dispatch -ne ($case.Expected -eq 'daily-update-missing')) {
        throw "Watchdog test failed: $($case.Name)"
    }
    Write-Output "PASS: $($case.Name)"
}
Write-Output 'Daily watchdog: all 11 cases passed'
