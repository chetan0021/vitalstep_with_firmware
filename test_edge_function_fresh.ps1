# Fresh Token Generation and Function Test

# Step 1: Get fresh JWT token
$body = @{
    email = "admin@vitalstep.com"
    password = "Admin123!@#"
} | ConvertTo-Json

Write-Host "Step 1: Getting fresh JWT token..."
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
    $userId = $tokenData.user.id

    Write-Host "✅ Fresh token received"
    Write-Host "User ID: $userId"
    Write-Host "Token preview: $($token.Substring(0,50))..."
    
    # Step 2: Call Edge Function with fresh token
    Write-Host "`nStep 2: Calling generate-device-id function..."
    
    $response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body "{}" `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | Format-List
} 
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "❌ ERROR - Status: $statusCode"
    
    if ($errorResponse) {
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Error Response:"
        Write-Host $body
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}
