# Simple Edge Function Test
$token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjVmOTA5MDcwLWM4YmItNDAwMi1iYzBmLWE4ZDg4NGY5ODU0MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL295cWVjZGNwaWN2end3dndhaWVrYS5zdXBhYmFzZS5jby9hdXRoL3YxIiwic3ViIjoiMDljNDExODktYjBjNy00ZGMwLWI5ZjktMTUzMTYyMDQxZGZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MTczMTQzNjk4MCwiaWF0IjoxNzMxNDMzMzgwLCJlbWFpbCI6ImFkbWluQHZpdGFsc3RlcC5jb20iLCJlbWFpbF9jb25maXJtZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsImFwcF9tZXRhZGF0YSI6e30sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiI1ZjAzMDAxMC00Y2Q0LTQ1ZDItYjg3NS00ZTczZTUzZWQ4YmUiLCJhY2wiOnsicm9sZXMiOlsiYXV0aGVudGljYXRlZCJdLCJwZXJtaXNzaW9ucyI6W119fQ.2B8KoVJKGxVEVzw7YPVRcqBBkRWx13AE0F7r0-KDK8CEO7gPf7eEVTN1QRBv8w0DEMdFuYcRAQtR_xCx-fFrOQ"

try {
    $response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body "{}" `
        -ErrorAction Stop

    Write-Host "SUCCESS - Status: $($response.StatusCode)"
    Write-Host $response.Content
} 
catch {
    $errorResponse = $_.Exception.Response
    $statusCode = $errorResponse.StatusCode.value__
    Write-Host "ERROR - Status: $statusCode"
    
    $stream = $errorResponse.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host $body
}
