# Test Device-Sync Edge Function with VS-790239 device
# This script tests the corrected Edge Function that queries device_inventory table

# Device credentials (from Supabase device_inventory table)
$deviceCode = "VS-790239"
$deviceSecret = "9a82b79b3f727f8b585f27f32a54765cf6cf5bcb89820bd6e101e729c5cecc3d"
$apiKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"

# Supabase Edge Function URL
$edgeFunctionUrl = "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/device-sync"

# Test 1: Basic device sync request (no measurements - unclaimed device)
Write-Host "======================================================================="
Write-Host "TEST 1: Device Sync - Unclaimed Device (No Measurements)"
Write-Host "======================================================================="

$body1 = @{
    action = "sync"
    fw = "1.0.0"
    hw = "VS-3248S035"
    battery_pct = 85
    battery_v = 8.2
    charging = $false
    rssi = -60
    device_time = [Math]::Floor([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
    time_valid = $true
    uptime_ms = 3600000
    boot_id = "boot_001"
    pending = 0
    measurements = @()
} | ConvertTo-Json -Depth 10

Write-Host "Sending request to: $edgeFunctionUrl`n"
Write-Host "Request body:`n$body1`n"

try {
    $response = Invoke-WebRequest -Uri $edgeFunctionUrl `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $apiKey
            "x-device-code" = $deviceCode
            "x-device-secret" = $deviceSecret
        } `
        -Body $body1 `
        -ErrorAction Stop

    Write-Host "SUCCESS - Status: $($response.StatusCode)"
    Write-Host "`nResponse:`n"
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "ERROR - Status: $statusCode`n"
    
    if ($errorResponse) {
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:`n$errorBody"
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}

# Test 2: Device sync with measurement
Write-Host "`n`n======================================================================="
Write-Host "TEST 2: Device Sync - With Measurement (Test Data)"
Write-Host "======================================================================="

$timestamp = [Math]::Floor([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

$body2 = @{
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
    pending = 1
    measurements = @(
        @{
            client_id = "test-meas-001"
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
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Sending request with measurement...`n"

try {
    $response = Invoke-WebRequest -Uri $edgeFunctionUrl `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $apiKey
            "x-device-code" = $deviceCode
            "x-device-secret" = $deviceSecret
        } `
        -Body $body2 `
        -ErrorAction Stop

    Write-Host "SUCCESS - Status: $($response.StatusCode)"
    Write-Host "`nResponse:`n"
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "ERROR - Status: $statusCode`n"
    
    if ($errorResponse) {
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:`n$errorBody"
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}

Write-Host "`n======================================================================="
Write-Host "Testing Complete!"
Write-Host "======================================================================="
