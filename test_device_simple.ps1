# Simple Device Test - VS-001001

$deviceCode = "VS-001001"
$deviceSecret = "29740c5e5bf1edfb0503264a306b01661836346fd126fa621f40d9d7cdd12c68"
$apiKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"
$url = "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/device-sync"

$timestamp = [Math]::Floor([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

# Measurement test
$body = @{
    action = "sync"
    fw = "1.0.0"
    hw = "VS-3248S035"
    battery_pct = 85
    battery_v = 8.2
    charging = $false
    rssi = -60
    device_time = $timestamp
    time_valid = $true
    uptime_ms = 3600000
    boot_id = "boot_001"
    pending = 2
    measurements = @(
        @{
            client_id = "test-001-L-sit"
            assessment_id = 1
            hand = "L"
            posture = "sitting"
            t1 = 15.5
            t2 = 16.2
            t3 = 15.8
            best = 16.2
            recorded_at = $timestamp
            time_valid = $true
            uptime_ms = 3600000
            boot_id = "boot_001"
            battery_pct = 85
        },
        @{
            client_id = "test-001-R-sit"
            assessment_id = 1
            hand = "R"
            posture = "sitting"
            t1 = 18.5
            t2 = 19.2
            t3 = 18.8
            best = 19.2
            recorded_at = $timestamp
            time_valid = $true
            uptime_ms = 3600000
            boot_id = "boot_001"
            battery_pct = 85
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Testing VS-001001 with measurements..."

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
    Write-Host "Response:"
    Write-Host "  ok: $($data.ok)"
    Write-Host "  claimed: $($data.claimed)"
    Write-Host "  accepted: $($data.accepted.Count)"
    Write-Host "  rejected: $($data.rejected.Count)"
    
    Write-Host "`nFull Response:"
    $data | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
