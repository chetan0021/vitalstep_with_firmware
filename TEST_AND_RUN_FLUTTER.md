# 🚀 Complete End-to-End Test & Flutter Launch

**Goal:** Test device sync from terminal, then launch Flutter app and verify data

---

## Step 1: Get Valid Device Code

### Option A: Generate via Admin Dashboard (Recommended - 2 minutes)

```
1. Open Vercel URL or localhost:3000/dashboard/generate
2. Click "Generate & Save to Supabase"
3. Copy device_code (e.g., VS-XXXXXX)
4. Copy device_secret (64-char hex)
```

### Option B: Create via SQL (5 minutes)

Go to Supabase → SQL Editor and run:

```sql
INSERT INTO public.device_inventory 
(device_code, device_secret, status) 
VALUES 
('VS-TEST-001', 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'manufactured');
```

Then use:
- Code: `VS-TEST-001`
- Secret: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

---

## Step 2: Test Edge Function from Terminal

Once you have device code + secret, run this PowerShell command:

```powershell
# Set your device credentials
$deviceCode = "VS-XXXXX"  # Replace with your code
$deviceSecret = "abc...def"  # Replace with your secret
$supabaseKey = "sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**"

# Create test payload
$testPayload = @{
    action = "sync"
    pair_pin = ""
    fw = "1.0.0"
    hw = "VS-3248S035"
    battery_pct = 85
    battery_v = 8.2
    charging = $false
    rssi = -65
    device_time = [int](New-TimeSpan -Start (Get-Date "1970-01-01") -End (Get-Date)).TotalSeconds
    time_valid = $true
    uptime_ms = 3600000
    boot_id = "test-boot-001"
    pending = 1
    measurements = @(
        @{
            client_id = "test-meas-001"
            assessment_id = 1
            hand = "Left"
            posture = "sitting"
            t1 = 15.2
            t2 = 15.5
            t3 = 15.1
            best = 15.5
            recorded_at = [int]((New-TimeSpan -Start (Get-Date "1970-01-01") -End (Get-Date)).TotalSeconds) - 100
            time_valid = $true
            battery_pct = 85
            boot_id = "test-boot-001"
        }
    )
} | ConvertTo-Json -Depth 10

# Send request
try {
    $response = Invoke-WebRequest -Uri "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/device-sync" `
      -Method POST `
      -Headers @{
        "Content-Type" = "application/json"
        "apikey" = $supabaseKey
        "x-device-code" = $deviceCode
        "x-device-secret" = $deviceSecret
      } `
      -Body $testPayload
    
    Write-Host "✅ SUCCESS! HTTP 200" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $streamReader.ReadToEnd()
    
    Write-Host "❌ Error: HTTP $statusCode" -ForegroundColor Red
    Write-Host "Response: $errorBody" -ForegroundColor Yellow
}
```

**Expected Success Response:**
```json
{
  "ok": true,
  "server_time": 1731740050,
  "claimed": false,
  "accepted": ["test-meas-001"],
  "rejected": []
}
```

---

## Step 3: Verify Data in Supabase

Run this SQL query in Supabase → SQL Editor:

```sql
SELECT * FROM measurements 
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;
```

**Expected:** You should see your test measurement with:
- hand = "Left"
- trial1 = 15.2, trial2 = 15.5, trial3 = 15.1
- best = 15.5

---

## Step 4: Prepare Flutter App

### Step 4a: Install Dependencies

```bash
cd c:\Users\Chetan\Documents\vitalstep_with_firmware-master
flutter pub get
```

### Step 4b: Connect Phone

1. Connect Android/iOS phone via USB
2. Enable USB Debugging (Android)
3. Trust the computer (iOS)
4. Run: `flutter devices` (should see your phone)

---

## Step 5: Run Flutter App

```bash
flutter run
```

This will:
1. Build the app
2. Install on your phone
3. Launch automatically
4. Show hot reload messages

---

## Step 6: Test in Flutter App

### Option A: If User Already Created

1. App opens → Login screen
2. Login with email/password
3. Go to "Results" or "History" screen
4. Should see your test measurement with:
   - Hand: Left
   - Trials: 15.2, 15.5, 15.1
   - Best: 15.5

### Option B: If New User

1. App opens → Signup screen
2. Create account (email + password)
3. Create device (optional)
4. Navigate to history
5. Should see the test measurement

---

## Complete Flow (Summary)

```
Terminal:
  ├── Send test measurement to Edge Function
  └── Get success response ✅

Supabase:
  ├── Measurement saved to database ✅
  └── Verify with SQL query ✅

Flutter App:
  ├── Query measurements table
  ├── Find test measurement
  └── Display on screen ✅
```

---

## Troubleshooting

### Terminal Test Failed?

**Error: "Device not found or invalid code"**
- Solution: Check device_code + device_secret in device_inventory table
- Run SQL: `SELECT * FROM device_inventory;`

**Error: "Connection refused"**
- Solution: Check internet connection
- Verify Supabase project is accessible
- Check Edge Function is deployed

### Flutter Won't Run?

**Error: "No device found"**
- Solution: Connect phone via USB
- Run: `flutter devices`
- Try: `flutter clean`

**Error: "Build failed"**
- Solution: Run `flutter pub get` again
- Try: `flutter clean && flutter pub get`
- Check: `flutter doctor`

**Error: "App crashes on launch"**
- Solution: Check Flutter logs: `flutter logs`
- Verify Supabase credentials in app
- Check internet connection on phone

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Get device code | 2 min | ⏳ Do this first |
| Test from terminal | 2 min | ⏳ After device code |
| Verify in Supabase | 1 min | ⏳ Check data |
| Prepare Flutter | 5 min | ⏳ `flutter pub get` |
| Run Flutter | 2 min | ⏳ `flutter run` |
| Test in app | 5 min | ⏳ Navigate and verify |
| **Total** | **~15-20 min** | ✅ Full end-to-end test |

---

## Success Criteria

✅ **Terminal test succeeds** (HTTP 200, accepted measurement)
✅ **Data appears in Supabase** (SQL query shows measurement)
✅ **Flutter app launches** (no build errors)
✅ **Measurement visible in app** (History/Results screen)

---

## Next: Physical Device Testing

After successful terminal + app test, ready for:
1. Real device measurement capture
2. Device WiFi provisioning
3. Actual sync to cloud
4. App retrieval of real data

---

## Commands Quick Reference

```powershell
# Flutter prep
flutter pub get
flutter devices
flutter run

# SQL checks
SELECT * FROM device_inventory LIMIT 5;
SELECT * FROM measurements ORDER BY created_at DESC LIMIT 10;

# Terminal test (after replacing credentials)
# Use the PowerShell script from Step 2
```

---

## Ready?

1. **Get device code** (Option A or B)
2. **Test from terminal** (Step 2)
3. **Run Flutter** (Step 5)

Let's go! 🚀
