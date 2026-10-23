$ErrorActionPreference = 'Stop'
$guard = Join-Path $PSScriptRoot 'Assert-LotteonJob.ps1'
$shell = (Get-Process -Id $PID).Path
$valid = @{
    GITHUB_REPOSITORY = 'bit-O-study/whisky_app'
    GITHUB_REPOSITORY_ID = '1249660635'
    GITHUB_REF = 'refs/heads/main'
    GITHUB_WORKFLOW_REF = 'bit-O-study/whisky_app/.github/workflows/lotteon-daily.yml@refs/heads/main'
    GITHUB_JOB = 'crawl'
    GITHUB_EVENT_NAME = 'schedule'
}
$original = @{}
foreach ($name in $valid.Keys) { $original[$name] = [Environment]::GetEnvironmentVariable($name) }
$cases = @(
    @{ Name = 'schedule'; Overrides = @{}; Allowed = $true },
    @{ Name = 'manual'; Overrides = @{ GITHUB_EVENT_NAME = 'workflow_dispatch' }; Allowed = $true },
    @{ Name = 'pull request'; Overrides = @{ GITHUB_REF = 'refs/pull/2/merge'; GITHUB_EVENT_NAME = 'pull_request' }; Allowed = $false },
    @{ Name = 'other repository'; Overrides = @{ GITHUB_REPOSITORY = 'other/repo' }; Allowed = $false },
    @{ Name = 'other repository ID'; Overrides = @{ GITHUB_REPOSITORY_ID = '123' }; Allowed = $false },
    @{ Name = 'other workflow'; Overrides = @{ GITHUB_WORKFLOW_REF = 'bit-O-study/whisky_app/.github/workflows/other.yml@refs/heads/main' }; Allowed = $false },
    @{ Name = 'other job'; Overrides = @{ GITHUB_JOB = 'e2e' }; Allowed = $false },
    @{ Name = 'missing identity'; Overrides = @{ GITHUB_REF = '' }; Allowed = $false }
)
try {
    foreach ($case in $cases) {
        foreach ($name in $valid.Keys) { [Environment]::SetEnvironmentVariable($name, $valid[$name]) }
        foreach ($name in $case.Overrides.Keys) { [Environment]::SetEnvironmentVariable($name, $case.Overrides[$name]) }
        & $shell -NoProfile -ExecutionPolicy Bypass -File $guard *> $null
        if (($LASTEXITCODE -eq 0) -ne $case.Allowed) { throw "Guard test failed: $($case.Name)" }
        Write-Output "PASS: $($case.Name)"
    }
} finally {
    foreach ($name in $original.Keys) { [Environment]::SetEnvironmentVariable($name, $original[$name]) }
}
Write-Output 'Runner guard: all 8 cases passed'
