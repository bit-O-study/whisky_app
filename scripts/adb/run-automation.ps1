param([string]$AdbPath = '', [string]$Serial = '', [switch]$Check, [switch]$Apply)
$ErrorActionPreference = 'Stop'
if ($AdbPath) { $env:ADB_PATH = $AdbPath }
if ($Serial) { $env:ADB_SERIAL = $Serial }
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location -LiteralPath $repo
$arguments = @((Join-Path $PSScriptRoot 'automate.mjs'))
if ($Check) { $arguments += '--check' }
if ($Apply) { $arguments += '--apply' }
& node @arguments
exit $LASTEXITCODE
