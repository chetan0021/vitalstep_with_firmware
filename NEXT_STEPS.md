# Next Steps - Edge Function Testing & Dashboard

## ⚠️ IMPORTANT: Supabase UI Tester Issue

The Supabase built-in test UI has a JWT validation issue that prevents testing directly in the dashboard. **This is a known Supabase limitation** - the UI tester uses a different API gateway that validates JWTs differently.

**Solution: Test externally instead (via PowerShell/curl)**

---

## STEP 1: Update Edge Function

Replace your current Edge Function code with the working version:

**File**: `generate-device-id-WORKING.ts` (already created in your project)

1. Go to Supabase → **Functions** → **generate-device-id** → **Code tab**
2. Delete all current code
3. Copy the entire content from: `generate-device-id-WORKING.ts`
4. Click **Deploy**

---

## STEP 2: Test via PowerShell (External Testing)

Run this test script:

```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\FINAL_TEST_SCRIPT.ps1"
```

**Expected output:**
```
========================================
STEP 1: Getting JWT Token
========================================

✅ Token obtained
User ID: 09c41189-b0c7-4dc0-b9f9-153162041dfa

========================================
STEP 2: Calling Edge Function
========================================

✅ SUCCESS!
Status Code: 200

Device Generated:
  Device Code:   VS-001001
  Device Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
  Created At:    2026-11-13T10:30:45.123Z
```

---

## STEP 3: Verify in Database

If test is successful, verify the device was created:

**In Supabase SQL Editor**, run:

```sql
SELECT device_code, device_secret, status, created_at 
FROM public.device_inventory 
ORDER BY created_at DESC 
LIMIT 1;
```

You should see your newly generated device.

---

## STEP 4: Build Next.js Dashboard

Once testing works, I'll create a professional Next.js dashboard with:

1. **Login Page**
   - Admin login (admin@vitalstep.com)
   - Session management

2. **Dashboard Home**
   - Generate Device ID button
   - Recent devices list
   - Quick stats

3. **Generate Device Page**
   - "Generate New Device" button
   - Displays device_code and device_secret
   - Download buttons for SD card files:
     - `devicecode.txt`
     - `devicesecret.txt`
   - Device image display

4. **Device Inventory**
   - Table of all devices
   - Filter by status (manufactured, in_field, paired, retired)
   - Search by device_code
   - Edit device details

5. **Audit Log**
   - View all admin actions
   - Filter by date/action/admin

6. **Settings**
   - Admin profile
   - Change password

---

## STEP 5: Deploy to Vercel

Once dashboard is ready:

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel
4. Deploy

---

## Next Action

**Run the test script now:**

```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\FINAL_TEST_SCRIPT.ps1"
```

Share the output (success or error), and I'll proceed with building the dashboard!

---

## FAQ

**Q: Why doesn't the Supabase test UI work?**
A: The UI test gateway validates JWTs before they reach your function. External testing (PowerShell/curl) works because it bypasses this.

**Q: Do I need to disable JWT?**
A: No! Keep JWT enabled. It's working correctly - the UI tester just has limitations.

**Q: Can I test from the mobile app?**
A: Yes! The mobile app will work fine once we integrate it.

