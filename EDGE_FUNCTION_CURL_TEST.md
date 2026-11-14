# Edge Function Testing - Curl Commands

## Step 1: Get Admin JWT Token

**Replace with your admin email/password:**

```powershell
$body = @{
    email = "admin@vitalstep.com"
    password = "Admin123!@#"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = "sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi"
    } `
    -Body $body

$tokenData = $response.Content | ConvertFrom-Json
$token = $tokenData.access_token

Write-Host "Token received:" $token
```

**Save the token value - you'll use it in the next step.**

---

## Step 2: Call Generate Device ID Function

**Replace TOKEN_HERE with the actual token:**

```powershell
$token = "YOUR_TOKEN_HERE"

$response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body "{}"

Write-Host "Response Status:" $response.StatusCode
Write-Host "Response Body:" $response.Content
```

---

## Step 3: Verify Success

**Expected success response:**
```json
{
  "ok": true,
  "device_code": "VS-001001",
  "device_secret": "9e345bc38b7bc7186b72252c80a72f6635d35dc2c54991d74b5f38c17c5d7179",
  "created_at": "2026-11-13T06:13:18.000Z"
}
```

---

## Debugging

If you get an error, check:

1. **401 Unauthorized** = Token is invalid or expired
   - Regenerate token with Step 1

2. **403 Forbidden** = User is not an admin
   - Check SQL: `SELECT * FROM public.admins WHERE email = 'admin@vitalstep.com';`
   - Make sure `is_active = true`

3. **400 Bad Request** = Database insert error
   - Check Edge Function logs in Supabase Dashboard → Functions → generate-device-id → Logs
   - Look for the exact error message

4. **500 Server Error** = Function code issue
   - Check Supabase edge function logs

---

## Check Function Logs

1. Go to **Supabase Dashboard**
2. **Functions** → **generate-device-id**
3. **Executions** tab - click the most recent execution to see logs

