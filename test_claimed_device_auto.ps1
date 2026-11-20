# Test Device-Sync with CLAIMED Device (VS-001001) - AUTOMATED
# This script automatically claims the device and then tests measurements

# Device credentials
$deviceCode = "VS-001001"
$deviceSecret = "29740c5e5bf1edfb0503264a306b01661836346fd126fa621f40d9d7cdd12c68"
$deviceId = "ddf12498-3f91-4f0a-89b4-f197556b2c0d"
$apiKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"

# User info
$patientUserIdUUID = "d9dd4237-2701-4475-9d9e-2fac790c760f"
$patientName = "Test Patient"

# Supabase
$supabaseUrl = "https://oyqecdcpicvzwwvwaeka.supabase.co"
$supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dmFla2EiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzMxMzkyNjE5LCJleHAiOjIwNDY5NjgyMTl9.TrD0vAMZMLB5A-XlLxVtj4h64u4z_TL5EFG8JFLVZz4"

$edgeFunctionUrl = "$supabaseUrl/functions/v1/device-sync"

Write-Host "`n========================================================================="
Write-Host "AUTOMATED TEST: Claim Device and Test Sync"
Write-Host "========================================================================="

Write-Host "`nDevice Info:"
Write-Host "  Code: $deviceCode"
Write-Host "  ID: $deviceId"
Write-Host "`nPatient Info:"
Write-Host "  UUID: $patientUserIdUUID"
Write-Host "  Name: $patientName"

Write-Host "`n========================================================================="
Write-Host "STEP 1: Claim Device in Supabase"
Write-Host "========================================================================="

Write-Host "`nClaiming device VS-001001 to Test Patient..."

$claimBody = @{
    id = $deviceId
    paired_user_id = $patientUserIdUUID
    paired_at = (Get-Date -AsUTC).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    status = "paired"
} | ConvertTo-Json

try {
    $claimResponse = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/device_inventory?id=eq.$deviceId" `
        -Method PATCH `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $supabaseServiceRoleKey"
            "apikey" = $apiKey
            "Prefer" = "return=minimal"
        } `
        -Body $claimBody `
        -ErrorAction Stop

    Write-Host "✅ Device claimed successfully (Status: $($claimResponse.StatusCode))"
}
catch {
    Write-Host "⚠️  Could not claim via REST API (might already be claimed)"
    Write-Host "   Error: $($_.Exception.Message)"
}

Write-Host "`nWaiting 2 seconds for Supabase to sync..."
Start-Sleep -Seconds 2

Write-Host "`n========================================================================="
Write-Host "STEP 2: Test Sync WITHOUT Measurements"
Write-Host "========================================================================="

$timestamp = [Math]::Floor([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds())

$body1 = @{
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
    pending = 0
    measurements = @()
} | ConvertTo-Json -Depth 10

Write-Host "`nSending sync request (no measurements, just check if claimed)..."

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

    Write-Host "✅ Response: HTTP $($response.StatusCode)"
    $responseData = $response.Content | ConvertFrom-Json
    
    Write-Host "`nDevice Status:"
    Write-Host "  ok: $($responseData.ok)"
    Write-Host "  claimed: $($responseData.claimed)"
    Write-Host "  device_id: $($responseData.device_id)"
    
    if ($responseData.claimed -eq $true) {
        Write-Host "`n✅ Device is CLAIMED!"
        if ($responseData.owner) {
            Write-Host "  Owner: $($responseData.owner.name)"
            Write-Host "  Patient Code: $($responseData.owner.patient_code)"
        } else {
            Write-Host "  (Claimed but no patient record)"
        }
    } else {
        Write-Host "`n⚠️  Device NOT claimed - claim may have failed"
        Write-Host "    You may need to manually update device_inventory in Supabase"
    }
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "❌ Error - Status: $statusCode"
    $stream = $errorResponse.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Response: $errorBody"
}

Write-Host "`n========================================================================="
Write-Host "STEP 3: Test Sync WITH Measurements"
Write-Host "========================================================================="

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

Write-Host "`nSending 2 measurements (Left + Right, sitting)..."

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

    Write-Host "✅ Response: HTTP $($response.StatusCode)"
    $responseData = $response.Content | ConvertFrom-Json
    
    Write-Host "`nMeasurement Results:"
    Write-Host "  Accepted: $($responseData.accepted.Count) measurements"
    Write-Host "  Rejected: $($responseData.rejected.Count) measurements"
    
    if ($responseData.accepted -and $responseData.accepted.Count -gt 0) {
        Write-Host "`n✅ SUCCESS! Measurements accepted:"
        foreach ($mid in $responseData.accepted) {
            Write-Host "  ✓ $mid"
        }
        Write-Host "`n>>> Now check Supabase 'measurements' table for stored data!"
    }
    
    if ($responseData.rejected -and $responseData.rejected.Count -gt 0) {
        Write-Host "`n⚠️  Rejected measurements:"
        foreach ($reject in $responseData.rejected) {
            Write-Host "  ✗ $($reject.client_id): $($reject.reason)"
        }
    }
    
    Write-Host "`nFull response:"
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "❌ Error - Status: $statusCode"
    $stream = $errorResponse.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Response: $errorBody"
}

Write-Host "`n========================================================================="
Write-Host "Test Complete!"
Write-Host "========================================================================="
Write-Host "`nNext Steps:"
Write-Host "  1. Verify measurements in Supabase:"
Write-Host "     SELECT * FROM measurements WHERE device_id = '$deviceId' ORDER BY recorded_at DESC;"
Write-Host "  2. Launch Flutter app with Test Patient credentials"
Write-Host "  3. Verify measurements appear in app dashboard"
