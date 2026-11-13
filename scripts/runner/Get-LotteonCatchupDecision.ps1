function Get-LotteonCatchupDecision {
    param(
        [Parameter(Mandatory = $true)][DateTimeOffset]$Now,
        $Success,
        [object[]]$Runs = @(),
        $LastDispatch
    )
    $zone = [TimeZoneInfo]::FindSystemTimeZoneById('Korea Standard Time')
    $local = [TimeZoneInfo]::ConvertTime($Now, $zone)
    $day = $local.ToString('yyyy-MM-dd')
    if ($local.Hour -lt 9 -or ($local.Hour -eq 9 -and $local.Minute -lt 30)) {
        return @{ Dispatch = $false; Reason = 'before-09:30' }
    }
    if ($Success -and ([TimeZoneInfo]::ConvertTime([DateTimeOffset]$Success.completedAt, $zone)).ToString('yyyy-MM-dd') -eq $day) {
        return @{ Dispatch = $false; Reason = 'already-updated-today' }
    }
    $operations = @($Runs | Where-Object { $_.event -in @('schedule', 'workflow_dispatch') })
    if (@($operations | Where-Object { $_.status -ne 'completed' }).Count) {
        return @{ Dispatch = $false; Reason = 'workflow-already-active' }
    }
    $successfulSchedule = @($operations | Where-Object {
        $_.event -eq 'schedule' -and $_.conclusion -eq 'success' -and
        ([TimeZoneInfo]::ConvertTime([DateTimeOffset]$_.updated_at, $zone)).ToString('yyyy-MM-dd') -eq $day
    })
    if ($successfulSchedule.Count) {
        return @{ Dispatch = $false; Reason = 'scheduled-update-succeeded' }
    }
    if ($LastDispatch -and $LastDispatch.day -eq $day) {
        if ($LastDispatch.attempts -ge 3) {
            return @{ Dispatch = $false; Reason = 'daily-attempt-limit' }
        }
        if (($Now - [DateTimeOffset]$LastDispatch.requestedAt).TotalMinutes -lt 15) {
            return @{ Dispatch = $false; Reason = 'dispatch-cooldown' }
        }
    }
    return @{ Dispatch = $true; Reason = 'daily-update-missing' }
}
