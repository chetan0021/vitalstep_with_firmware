# Test Device-Sync with CLAIMED Device (VS-001001)
# Device owned by: Test Patient (d9dd4237-2701-4475-9d9e-2fac790c760f)

# Device credentials (from SD card)
$deviceCode = "VS-001001"
$deviceSecret = "29740c5e5bf1edfb0503264a306b01661836346fd126fa621f40d9d7cdd12c68"
$apiKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"
$supabaseUrl = "https://oyqecdcpicvzwwvwaeka.supabase.co"

# User info (from profiles table)
$patientUserIdUUID = "d9dd4237-2701-4475-9d9e-2fac790c760f"
$patientName = "Test Patient"

# Edge Function URL
$edgeFunctionUrl = "$supabaseUrl/functions/v1/device-sync"

Write-Host "`n========================================================================="
Write-Host "STEP 1: Claim Device to Test Patient in Supabase"
Write-Host "========================================================================="

# First, let's check if the device_inventory record exists and get its ID
Write-Host "`nChecking device_inventory table for VS-001001..."

$checkDeviceQuery = @{
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
}

Write-Host "`nDevice Info From SD Card:"
Write-Host "  Device Code: VS-001001"
Write-Host "  Device ID: ddf12498-3f91-4f0a-89b4-f197556b2c0d"
Write-Host "  Device Secret: 29740c5e5bf1edfb0503264a306b01661836346fd126fa621f40d9d7cdd12c68"
Write-Host "  Current Status: manufactured (unclaimed)"
Write-Host "`nPatient Info:"
Write-Host "  Patient UUID: d9dd4237-2701-4475-9d9e-2fac790c760f"
Write-Host "  Patient Name: Test Patient"
Write-Host "  Patient Email: test@vitalstep.local"

Write-Host "`n>>> IMPORTANT: You need to claim the device in Supabase dashboard:"
Write-Host "    1. Go to Supabase → device_inventory table"
Write-Host "    2. Find row where device_code = 'VS-001001'"
Write-Host "    3. Set paired_user_id = 'd9dd4237-2701-4475-9d9e-2fac790c760f'"
Write-Host "    4. Set paired_at = NOW()"
Write-Host "    5. Set status = 'paired'"
Write-Host "    6. Save"
Write-Host "`nOr run this SQL in Supabase SQL Editor:"
Write-Host "    UPDATE public.device_inventory"
Write-Host "    SET paired_user_id = 'd9dd4237-2701-4475-9d9e-2fac790c760f',"
Write-Host "        paired_at = NOW(),"
Write-Host "        status = 'paired'"
Write-Host "    WHERE device_code = 'VS-001001';"
Write-Host "`nPress ENTER after you've claimed the device in Supabase..."
Read-Host

Write-Host "`n========================================================================="
Write-Host "STEP 2: Create Test Patient Record (if needed)"
Write-Host "========================================================================="

Write-Host "`nPatient record info (from profiles table):"
Write-Host "  ID: d9dd4237-2701-4475-9d9e-2fac790c760f"
Write-Host "  Name: Test Patient"
Write-Host "  Email: test@vitalstep.local"
Write-Host "  User Type: Patient"
Write-Host "`nNote: Check if a 'patients' table record exists for this user."
Write-Host "If not, Edge Function will handle it gracefully (returns claimed=true but owner=null until patient record exists)"

Write-Host "`n========================================================================="
Write-Host "STEP 3: Test Device Sync WITHOUT Measurements (verify claim)"
Write-Host "========================================================================="

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

Write-Host "`nSending sync request to: $edgeFunctionUrl"
Write-Host "Device: VS-001001 (should now be CLAIMED)"

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

    Write-Host "`n✅ SUCCESS - Status: $($response.StatusCode)"
    Write-Host "`nResponse:"
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
    
    Write-Host "`nDevice Claim Status:"
    Write-Host "  claimed: $($responseData.claimed)"
    Write-Host "  device_id: $($responseData.device_id)"
    
    if ($responseData.claimed -eq $true) {
        Write-Host "`n✅ Device is CLAIMED! Owner info:"
        if ($responseData.owner) {
            Write-Host "  Owner Name: $($responseData.owner.name)"
            Write-Host "  Patient Code: $($responseData.owner.patient_code)"
        } else {
            Write-Host "  (No patient record found yet)"
        }
    } else {
        Write-Host "`n❌ Device is still UNCLAIMED"
        Write-Host "    Make sure you updated device_inventory in Supabase"
    }
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "`n❌ ERROR - Status: $statusCode"
    
    if ($errorResponse) {
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:`n$errorBody"
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}

Write-Host "`n========================================================================="
Write-Host "STEP 4: Test Device Sync WITH Measurements"
Write-Host "========================================================================="

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
            client_id = "test-meas-left-sitting-001"
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
            client_id = "test-meas-right-sitting-001"
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

Write-Host "`nSending 2 measurements (Left + Right, sitting position)..."
Write-Host "Expected: Both measurements ACCEPTED if device is claimed`n"

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

    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)"
    Write-Host "`nResponse:"
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
    
    Write-Host "`nMeasurement Results:"
    Write-Host "  Accepted: $($responseData.accepted.Count) measurements"
    Write-Host "  Rejected: $($responseData.rejected.Count) measurements"
    
    if ($responseData.accepted.Count -gt 0) {
        Write-Host "`n✅ SUCCESS! Measurements stored in Supabase!"
        Write-Host "`nAccepted measurement IDs:"
        foreach ($mid in $responseData.accepted) {
            Write-Host "  - $mid"
        }
        Write-Host "`n>>> Next step: Check Supabase 'measurements' table for these records"
        Write-Host "    Query: SELECT * FROM measurements WHERE device_id = '$($responseData.device_id)'"
    }
    
    if ($responseData.rejected.Count -gt 0) {
        Write-Host "`n⚠️  Some measurements rejected:"
        foreach ($reject in $responseData.rejected) {
            Write-Host "  - $($reject.client_id): $($reject.reason)"
        }
    }
}
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "❌ ERROR - Status: $statusCode"
    
    if ($errorResponse) {
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:`n$errorBody"
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}

Write-Host "`n========================================================================="
Write-Host "Testing Complete!"
Write-Host "========================================================================="
Write-Host "`nSummary:"
Write-Host "  1. Device VS-001001 should now be CLAIMED"
Write-Host "  2. Measurements should be ACCEPTED (if device is claimed)"
Write-Host "  3. Check Supabase 'measurements' table for stored data"
Write-Host "  4. Next: Launch Flutter app to verify app can read measurements"
