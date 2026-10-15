$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'adb/collect.mjs') @args
exit $LASTEXITCODE
