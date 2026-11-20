$body = @{
    email = "admin@vitalstep.com"
    password = "Admin123!@#"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"
    } `
    -Body $body

$data = $response.Content | ConvertFrom-Json
$data.access_token | clip
Write-Host "✅ Token copied to clipboard!"
Write-Host "Paste it in the Supabase test form with: Bearer [paste here]"
