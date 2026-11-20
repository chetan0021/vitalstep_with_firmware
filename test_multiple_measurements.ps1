# Test multiple measurements batch - comprehensive test

$deviceCode = "VS-001001"
$deviceSecret = "29740c5e5bf1edfb0503264a306b01661836346fd126fa621f40d9d7cdd12c68"
$apiKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"
$url = "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/device-sync"

$timestamp = [Math]::Floor([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

Write-Host "`n========================================================================="
Write-Host "TEST: Multiple Measurements Batch (Standing Position)"
Write-Host "========================================================================="

# Send measurements for both hands in standing position
$body = @{
    action = "sync"
    fw = "1.0.0"
    hw = "VS-3248S035"
    battery_pct = 75
    battery_v = 8.0
    charging = $false
    rssi = -55
    device_time = $timestamp
    time_valid = $true
    uptime_ms = 3600000
    boot_id = "boot_001"
    pending = 2
    measurements = @(
        @{
            client_id = "test-002-L-stand"
            assessment_id = 2
            hand = "L"
            posture = "standing"
            t1 = 12.5
            t2 = 13.8
            t3 = 13.2
            best = 13.8
            recorded_at = $timestamp
            time_valid = $true
            uptime_ms = 3600000
            boot_id = "boot_001"
            battery_pct = 75
        },
        @{
            client_id = "test-002-R-stand"
            assessment_id = 2
            hand = "R"
            posture = "standing"
            t1 = 16.2
            t2 = 17.5
            t3 = 16.8
            best = 17.5
            recorded_at = $timestamp
            time_valid = $true
            uptime_ms = 3600000
            boot_id = "boot_001"
            battery_pct = 75
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Sending 2 measurements (Left + Right, Standing position)..."
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $apiKey
            "x-device-code" = $deviceCode
            "x-device-secret" = $deviceSecret
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Results:"
    Write-Host "  Device claimed: $($data.claimed)"
    Write-Host "  Measurements accepted: $($data.accepted.Count)"
    Write-Host "  Measurements rejected: $($data.rejected.Count)"
    
    if ($data.accepted.Count -gt 0) {
        Write-Host ""
        Write-Host "Accepted IDs:"
        foreach ($id in $data.accepted) {
            Write-Host "    ✓ $id"
        }
    }
    
    if ($data.rejected.Count -gt 0) {
        Write-Host ""
        Write-Host "Rejected:"
        foreach ($reject in $data.rejected) {
            Write-Host "    ✗ $($reject.client_id): $($reject.reason)"
        }
    }
    
    Write-Host ""
    Write-Host "Full response:"
    $data | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}

Write-Host ""
Write-Host "========================================================================="
Write-Host "Test Complete!"
Write-Host "========================================================================="
Write-Host ""
Write-Host "Summary: You should now have 4 total measurements in Supabase:"
Write-Host "  - 2 sitting measurements (L=16.2kg, R=19.2kg)"
Write-Host "  - 2 standing measurements (L=13.8kg, R=17.5kg)"
Write-Host ""
Write-Host "Query in Supabase to verify:"
Write-Host "  SELECT hand, posture, best FROM measurements"
Write-Host "  WHERE device_id = 'ddf12498-3f91-4f0a-89b4-f197556b2c0d'"
Write-Host "  ORDER BY recorded_at DESC;"
