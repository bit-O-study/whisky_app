param([Parameter(Mandatory = $true)][string]$RunnerDirectory)
$ErrorActionPreference = 'Stop'
$guard = Join-Path (Split-Path -Parent $RunnerDirectory) 'Assert-LotteonJob.ps1'
if (!(Test-Path -LiteralPath $guard) -or !(Test-Path -LiteralPath (Join-Path $RunnerDirectory '.runner'))) {
    throw 'The registered runner and installed job guard are required'
}
$mutex = New-Object System.Threading.Mutex($false, 'Local\WhiskyLotteonRunner')
if (!$mutex.WaitOne(0)) { $mutex.Dispose(); exit 0 }
try {
    # Do not pass the configuring shell's GitHub credential to jobs.
    Remove-Item Env:GH_TOKEN,Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
    $env:ACTIONS_RUNNER_HOOK_JOB_STARTED = $guard
    Set-Location -LiteralPath $RunnerDirectory
    & (Join-Path $RunnerDirectory 'run.cmd')
    exit $LASTEXITCODE
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
