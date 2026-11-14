# Final Edge Function Test - Works with curl/PowerShell

# Step 1: Get fresh token
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Getting JWT Token" -ForegroundColor Cyan
Write-Host "========================================`n"

$body = @{
    email = "admin@vitalstep.com"
    password = "Admin123!@#"
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = "sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi"
        } `
        -Body $body `
        -ErrorAction Stop

    $tokenData = $tokenResponse.Content | ConvertFrom-Json
    $token = $tokenData.access_token

    Write-Host "✅ Token obtained" -ForegroundColor Green
    Write-Host "User ID: $($tokenData.user.id)`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to get token" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# Step 2: Test the Edge Function
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Calling Edge Function" -ForegroundColor Cyan
Write-Host "========================================`n"

try {
    $response = Invoke-WebRequest `
        -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body '{}' `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)`n" -ForegroundColor Green
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Device Generated:" -ForegroundColor Green
    Write-Host "  Device Code:   $($result.device_code)" -ForegroundColor White
    Write-Host "  Device Secret: $($result.device_secret)" -ForegroundColor White
    Write-Host "  Created At:    $($result.created_at)" -ForegroundColor White
}
catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Yellow
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================`n"
