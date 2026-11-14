# Testing Edge Function in Supabase UI

## Step 1: Get Your JWT Token

Run this PowerShell command to get a fresh token:

```powershell
$body = @{
    email = "admin@vitalstep.com"
    password = "Admin123!@#"
} | ConvertTo-Json

$tokenResponse = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = "sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi"
    } `
    -Body $body

$tokenData = $tokenResponse.Content | ConvertFrom-Json
$token = $tokenData.access_token

Write-Host "Copy this token:"
Write-Host $token
```

**Copy the entire token value** (it's a long string starting with `eyJ...`)

---

## Step 2: Fill in the Supabase Test Form

In the Supabase dashboard where you see "Test generate-device-id":

### HTTP Method
✅ Already set to **POST**

### Request Body
✅ Already set to **`{ "name": "functions" }`** - CHANGE THIS TO:
```json
{}
```

(Just empty curly braces)

### Headers
Click **+ Add header** and add:

**Header name:** `Authorization`
**Header value:** `Bearer YOUR_TOKEN_HERE`

Example:
```
Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjVmOTA5MDcwLWM4YmItNDAwMi1iYzBmLWE4ZDg4NGY5ODU0MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL295cWVjZGNwaWN2end3dndhaWVrYS5zdXBhYmFzZS5jby9hdXRoL3YxIiwic3ViIjoiMDljNDExODktYjBjNy00ZGMwLWI5ZjktMTUzMTYyMDQxZGZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MTczMTQzNjk4MCwiaWF0IjoxNzMxNDMzMzgwLCJlbWFpbCI6ImFkbWluQHZpdGFsc3RlcC5jb20iLCJlbWFpbF9jb25maXJtZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsImFwcF9tZXRhZGF0YSI6e30sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiI1ZjAzMDAxMC00Y2Q0LTQ1ZDItYjg3NS00ZTczZTUzZWQ4YmUiLCJhY2wiOnsicm9sZXMiOlsiYXV0aGVudGljYXRlZCJdLCJwZXJtaXNzaW9ucyI6W119fQ.2B8KoVJKGxVEVzw7YPVRcqBBkRWx13AE0F7r0-KDK8CEO7gPf7eEVTN1QRBv8w0DEMdFuYcRAQtR_xCx-fFrOQ
```

---

## Step 3: Click Send

Click the **Send your first test request** button (or the arrow button)

---

## Expected Success Response

```json
{
  "ok": true,
  "device_code": "VS-001001",
  "device_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "created_at": "2026-11-13T10:30:45.123Z"
}
```

---

## Expected Error Responses

**401 Unauthorized**
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```
→ Token is invalid or expired. Get a fresh token.

**403 Forbidden**
```json
{
  "ok": false,
  "error": "User is not an authorized admin"
}
```
→ Admin user not found in admins table. Check SQL.

**400 Bad Request**
```json
{
  "ok": false,
  "error": "insert or update on table violates foreign key constraint"
}
```
→ Database issue. Check that user exists in auth.users.

---

## Troubleshooting

### If you get errors, check the function logs:

1. Go to **Functions** → **generate-device-id**
2. Click **Executions** tab
3. Click the failed execution
4. Look at the logs to see what went wrong

The logs will show:
- Token verification status
- Admin check result
- Database operation details
- Any error messages

---

## Once Testing Works

We'll build the Next.js dashboard with:
- Login page
- Generate Device ID button
- Download SD card files
- Device inventory list
- Audit log viewer
