$ErrorActionPreference = 'Stop'

# This installed copy runs before any checkout or workflow step.
$expected = @{
    GITHUB_REPOSITORY = 'bit-O-study/whisky_app'
    GITHUB_REPOSITORY_ID = '1249660635'
    GITHUB_REF = 'refs/heads/main'
    GITHUB_WORKFLOW_REF = 'bit-O-study/whisky_app/.github/workflows/lotteon-daily.yml@refs/heads/main'
    GITHUB_JOB = 'crawl'
}
foreach ($name in $expected.Keys) {
    if ([Environment]::GetEnvironmentVariable($name) -cne $expected[$name]) {
        Write-Output "This PC runner rejected the job: invalid $name"
        exit 1
    }
}
if ($env:GITHUB_EVENT_NAME -cnotin @('schedule', 'workflow_dispatch')) {
    Write-Output 'This PC runner only accepts scheduled or manually dispatched main jobs'
    exit 1
}
Write-Output 'Lotteon PC runner: main daily workflow identity accepted'
