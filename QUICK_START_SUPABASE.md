# Quick Start: VitalStep Supabase Setup (5 Minutes)

## Your Project Details

```
Project Name: vitalstep-device-sync-v2
Project URL: https://oyqecdcpicvzwwwaeka.supabase.co
Publishable Key: sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**
```

---

## Step 1: Run Database Migration (2 minutes)

### 1. Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select project: `vitalstep-device-sync-v2`
3. Left sidebar → Click **SQL Editor**
4. Click **"New Query"** button

### 2. Paste & Execute Migration

1. Open file: `supabase_migration_v2_complete.sql` in this repository
2. Copy entire file contents
3. Paste into SQL Editor query window
4. Click **"Run"** button (or Ctrl+Enter)

**Result:** All tables created successfully ✅

---

## Step 2: Get Your Anon Key (1 minute)

### 1. Go to API Settings

1. Click **Settings** (gear icon, bottom left)
2. Click **API** (under Settings)

### 2. Copy Anon Key

Under **Project API Keys** → find **ANON_PUBLIC**

Copy the full key that starts with `eyJ...`

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3d2Fla2EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU0ODQ3MCwiZXhwIjoyMDQ4MTI0NDcwfQ.YOUR_ACTUAL_KEY_HERE
```

---

## Step 3: Update Flutter App (2 minutes)

### Run with Supabase

```bash
cd /path/to/vitalstep_with_firmware

flutter clean
flutter pub get

# Development
flutter run \
  --dart-define=VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co \
  --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<paste_your_anon_key_here>
```

Replace `<paste_your_anon_key_here>` with the actual key from Step 2.

---

## Step 4: Test Sign Up (Optional but recommended)

1. App opens to login screen
2. Click **"Sign Up"**
3. Fill in test patient details:
   - Name: Test Patient
   - Email: test@example.com
   - Password: Test123!
   - Phone: 9876543210
   - Other fields: any values
4. Click **"Sign Up"**

**Expected:**
- Account created ✅
- App navigates to home
- Data appears in Supabase Table Editor

---

## All Done! 🎉

Your VitalStep app is now running on Supabase!

### What Works Now

✅ User authentication (sign up/sign in)
✅ User profile management
✅ Assessment creation and management
✅ Test result saving (3-trial measurements)
✅ Device management
✅ Specialist access control
✅ Comments/remarks
✅ Research patient mode
✅ All kill-switch functionality

### Next Steps

1. **Test all features** (see SUPABASE_MIGRATION_GUIDE.md)
2. **Build for production**:
   ```bash
   flutter build apk --release \
     --dart-define=VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co \
     --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<your_anon_key>
   ```
3. **Deploy to Play Store**

---

## Troubleshooting

### "Invalid API key"
- Copy Anon key again (Settings → API → ANON_PUBLIC)
- Make sure it's not the Publishable Key (different thing)
- No spaces before/after

### "Tables not found"
- Check migration ran without errors
- Go to Table Editor → should see 10 tables

### "Build failed"
```bash
flutter clean
flutter pub get
# Try running again
```

### "Connection refused"
- Internet working? ✓
- Project URL correct? ✓
- Anon key valid? ✓

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase_migration_v2_complete.sql` | Database schema (run this first) |
| `lib/services/supabase_service.dart` | New service layer (already added) |
| `lib/main.dart` | Updated configuration (already updated) |
| `SUPABASE_MIGRATION_GUIDE.md` | Detailed guide with all options |
| `QUICK_START_SUPABASE.md` | This file (quick reference) |

---

## Security Notes

🔒 **Do NOT:**
- Commit anon key to Git
- Share anon key in Slack/Email
- Paste key in code (always use --dart-define)

✅ **Do:**
- Store key in `.env` file
- Use build-time configuration
- Rotate keys every 90 days

---

## Your Anon Key

Keep this safe:
```
Project URL: https://oyqecdcpicvzwwwaeka.supabase.co
Anon Key: _________________ (your key here)
```

---

**That's it! You're ready to go.** 🚀
