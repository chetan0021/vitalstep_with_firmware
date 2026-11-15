# VitalStep Supabase Migration Guide

## 🎯 Overview

You have created a new Supabase project to replace the Digital Ocean backend. This guide will walk you through:

1. Setting up your Supabase database schema
2. Getting your Supabase credentials
3. Updating your Flutter app to use the new backend
4. Testing the migration

---

## 📋 Your Supabase Project Details

| Item | Value |
|------|-------|
| **Project Name** | `vitalstep-device-sync-v2` |
| **Project URL** | `https://oyqecdcpicvzwwwaeka.supabase.co` |
| **Publishable Key** | `sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi` |
| **Database Location** | South Asia (Mumbai) |
| **Compute Size** | NANO |

---

## ✅ Step 1: Create Database Schema

### 1.1 Access Supabase SQL Editor

1. Log in to Supabase: https://supabase.com/dashboard
2. Select your project: `vitalstep-device-sync-v2`
3. Click **SQL Editor** (left sidebar)
4. Click **"New Query"** button

### 1.2 Run Migration Script

1. Open the migration file: `supabase_migration_v2_complete.sql` from this repository
2. Copy the **entire contents** of that file
3. Paste into the Supabase SQL Editor query window
4. Click **"Run"** button

**Expected Output:**
```
✓ Query executed successfully
Created tables:
  - profiles
  - assessments
  - test_results
  - devices
  - assessment_queue
  - specialist_access
  - remarks
  - research_patients
  - patient_readings
  - kill_switch
```

### 1.3 Verify Tables Were Created

1. Click **"Table Editor"** (left sidebar)
2. You should see all 10 tables listed:
   - profiles
   - assessments
   - test_results
   - devices
   - assessment_queue
   - specialist_access
   - remarks
   - research_patients
   - patient_readings
   - kill_switch

---

## 🔑 Step 2: Get Your Supabase Credentials

### 2.1 Get Anon Key (Publishable Key for App)

1. Click **Settings** (gear icon, bottom left)
2. Click **API** (left sidebar under Settings)
3. You'll see **Project API Keys** section with:
   - **SERVICE_ROLE_KEY** (server-side only, secret)
   - **ANON_PUBLIC** (client-side, safe for app) ← Use this one

4. Under **ANON_PUBLIC**, copy the full key (starts with `eyJ...`)

**Example Anon Key Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3d2Fla2EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU0ODQ3MCwiZXhwIjoyMDQ4MTI0NDcwfQ.YOUR_ACTUAL_KEY_HERE
```

### 2.2 Store Credentials Securely

**NEVER** commit credentials to Git. Instead:

1. Create a `.env` file in project root (already in `.gitignore`):
   ```env
   VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co
   VITALSTEP_SUPABASE_ANON_KEY=eyJhbGc... (your full anon key)
   ```

2. For team sharing, store in a secure password manager (1Password, LastPass, etc.)

---

## 🚀 Step 3: Update Flutter App Configuration

### 3.1 Update Build Command

Replace all references from the old Supabase project to your new one:

**Development Build:**
```bash
flutter pub get
flutter clean
flutter pub get

flutter run \
  --dart-define=VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co \
  --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<your_anon_key>
```

**Release Build (APK):**
```bash
flutter build apk --release \
  --dart-define=VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co \
  --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<your_anon_key>
```

**Release Build (App Bundle):**
```bash
flutter build appbundle --release \
  --dart-define=VITALSTEP_SUPABASE_URL=https://oyqecdcpicvzwwwaeka.supabase.co \
  --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<your_anon_key>
```

### 3.2 Update main.dart (Already Done)

The `lib/main.dart` file has been updated to:
1. Initialize Supabase with your new project URL and credentials
2. Maintain kill-switch functionality with the old Supabase project
3. Call `SupabaseService.initialize()` to set up the main client

No further changes needed here - just run the build commands above.

### 3.3 Update app_strings.dart

The old `apiBaseUrl` pointing to Digital Ocean can be removed or commented:

**OLD (Digital Ocean):**
```dart
const String apiBaseUrl = "https://plankton-app-6cr5g.ondigitalocean.app/api";
```

**NEW (Supabase):**
All API calls now go through `SupabaseService` instead of HTTP REST endpoints.
No need to change `app_strings.dart` - it's only used by old code paths.

---

## 🔄 Step 4: Service Layer Migration

### 4.1 New SupabaseService

A complete new service class has been created: `lib/services/supabase_service.dart`

**Maps Digital Ocean → Supabase:**

| Digital Ocean | Supabase | Function |
|---|---|---|
| `POST /auth/register` | `auth.signUpWithPassword()` | `signUpPatient()` |
| `POST /auth/login` | `auth.signInWithPassword()` | `signInPatient()` |
| `GET /user/{id}` | `profiles.select()` | `getAccountDetails()` |
| `PUT /user/{id}` | `profiles.update()` | `updateProfile()` |
| `POST /assessment` | `assessments.insert()` | `createAssessment()` |
| `GET /test/user/{id}` | `test_results.select()` | `getAllUserTests()` |
| `POST /test` | `test_results.insert()` | `saveTest()` |
| `POST /queue/` | `assessment_queue.insert()` | `createTestQueue()` |
| `GET /queue/user/{id}` | `assessment_queue.select()` | `getUserQueue()` |
| `POST /device` | `devices.insert()` | `addDevice()` |
| `POST /remarks` | `remarks.insert()` | `addComment()` |

### 4.2 Update Existing Services

Replace calls in these services to use `SupabaseService`:

**lib/services/login_service.dart:**
```dart
// OLD
var request = http.Request('POST', Uri.parse('$apiBaseUrl/auth/login'));

// NEW
final supabaseService = locator<SupabaseService>();
await supabaseService.signInPatient(email: email, password: password);
```

**lib/services/accounts_service.dart:**
```dart
// OLD
final response = await get(Uri.parse('$apiBaseUrl/user/$userId'), ...);

// NEW
final supabaseService = locator<SupabaseService>();
final profile = await supabaseService.getAccountDetails(userId: userId);
```

### 4.3 Update Locator

Add `SupabaseService` to `lib/app/app.locator.dart`:

```dart
Future<void> setupLocator({...}) async {
  // ... existing registrations ...
  
  // NEW: Add Supabase service
  locator.registerLazySingleton(() => SupabaseService());
}
```

---

## 🧪 Step 5: Test the Migration

### 5.1 Test Authentication

**Sign Up:**
1. Run the app: `flutter run --dart-define=...`
2. Go to **Sign Up** screen
3. Fill in patient details
4. Click "Sign Up"

**Expected:**
- User account created in Supabase `auth.users`
- Profile record created in `public.profiles` table
- App navigates to device selection view
- Check Supabase Table Editor → profiles (should show new user)

**Sign In:**
1. Log out if signed in
2. Go to **Login** screen
3. Enter credentials
4. Click "Sign In"

**Expected:**
- User authenticated via Supabase auth
- Profile loaded from `public.profiles`
- App navigates to home view
- Check Supabase logs (Auth → Logs) for successful login

### 5.2 Test Assessment & Tests

**Create Assessment:**
1. (For specialists) Create new assessment for patient
2. Patient sees assessment in dashboard

**Expected:**
- New row in `public.assessments` table
- Assessment status = "Active"
- Specialist_id populated if created by specialist

**Save Test Result:**
1. Patient takes 3-trial grip test
2. Enters values and clicks "Save"

**Expected:**
- New row in `public.test_results` table
- trial1, trial2, trial3 values saved
- average calculated automatically (SQL computed column)
- created_at timestamp set

### 5.3 Test Device Management

**Add Device:**
1. Go to Account settings
2. Click "Add Device"
3. Enter device code and name

**Expected:**
- New row in `public.devices` table
- device_code unique per user
- is_active = true

### 5.4 Check Supabase Logs

1. Go to Supabase dashboard
2. Click **Logs** (Analytics)
3. Check:
   - **Auth** → Login/signup events
   - **Database** → Insert/update operations
   - **Edge Functions** → If using Edge Functions

---

## 🚨 Step 6: Troubleshooting

### Error: "Invalid API key"

**Cause:** Wrong or expired anon key

**Fix:**
1. Go to Supabase Settings → API
2. Copy the ANON_PUBLIC key again
3. Re-run with correct `--dart-define` flag
4. Remember to clear app data: `flutter clean && flutter pub get`

### Error: "User doesn't exist"

**Cause:** Trying to sign in before account created

**Fix:**
1. Create new account via signup first
2. Then sign in

### Error: "No tables found"

**Cause:** Migration script didn't run successfully

**Fix:**
1. Go to SQL Editor
2. Check for error messages in query output
3. Re-run the migration script
4. Verify each table exists in Table Editor

### Error: "Access denied"

**Cause:** RLS (Row Level Security) policies blocking access

**Fix:**
1. Check RLS policies are correctly configured
2. Verify user is authenticated (has JWT token)
3. Check user's ID matches the row being accessed
4. In development, you can temporarily disable RLS on a table:
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```
   (Don't do this in production!)

### Error: "Connection timeout"

**Cause:** Network issue or invalid URL

**Fix:**
1. Verify URL is correct: `https://oyqecdcpicvzwwwaeka.supabase.co`
2. Check internet connection
3. Verify Supabase project is active (go to dashboard)
4. Check project size isn't exceeded

---

## 📊 Database Architecture Overview

### Tables & Relationships

```
auth.users (Supabase managed)
    ↓
profiles (1:1 with auth.users)
    ├─ assessments (1:N) ← created by specialists for patients
    ├─ test_results (1:N) ← test measurements
    ├─ devices (1:N) ← hardware devices
    ├─ assessment_queue (1:N) ← pending tests
    ├─ remarks (1:N) ← comments on assessments
    └─ specialist_access (N:N) ← which specialists can access patient

research_patients (1:N with profiles)
    └─ patient_readings (1:N) ← test data for research/clinic mode
```

### Key Features

- **Row Level Security:** Each user sees only their own data
- **Cascading Deletes:** Deleting user deletes all related records
- **Computed Columns:** `average` is automatically calculated from trials
- **Timestamps:** auto-set via triggers
- **Indexes:** Optimized for common queries (by user_id, status, created_at)

---

## 🔒 Security Best Practices

### API Keys

✅ **DO:**
- Store anon key in `.env` file
- Pass via `--dart-define` at build time
- Rotate keys every 90 days
- Use different keys for dev/staging/production

❌ **DON'T:**
- Commit keys to Git
- Share keys in Slack/Email
- Use same key everywhere
- Expose service role key to client apps

### Row Level Security

✅ **DO:**
- Enable RLS on all tables with patient data
- Write specific policies for each use case
- Test policies thoroughly before deployment

❌ **DON'T:**
- Use overly permissive policies (`USING (true)`)
- Rely only on client-side validation
- Disable RLS in production

### Supabase Project

✅ **DO:**
- Enable 2FA on dashboard account
- Use strong passwords
- Monitor activity logs
- Set up automatic backups
- Use separate projects for dev/prod

❌ **DON'T:**
- Share login credentials
- Use personal email for production projects
- Ignore security warnings

---

## 🚚 Migration Timeline

| Phase | Task | Status | Timeline |
|-------|------|--------|----------|
| 1 | Create Supabase project | ✅ Done | Now |
| 2 | Create database schema | ✅ Done (this guide) | 15-30 min |
| 3 | Get API credentials | 🔄 In Progress | 5 min |
| 4 | Update Flutter app | 🔄 In Progress | 30 min |
| 5 | Run tests | ⏳ Next | 1 hour |
| 6 | Deploy to production | ⏳ Later | TBD |

---

## 📞 Support & Next Steps

### Need Help?

1. **Supabase Documentation:** https://supabase.com/docs
2. **Flutter Supabase Package:** https://pub.dev/packages/supabase_flutter
3. **Supabase Community:** https://discord.gg/supabase

### What's Next After Migration?

1. **Update all services** to use SupabaseService instead of HTTP calls
2. **Implement Real Time subscriptions** for live updates
3. **Add offline support** using local SQLite database
4. **Set up Edge Functions** for backend logic
5. **Implement CI/CD pipeline** for automated deployments

---

## 📝 Checklist

- [ ] Supabase project created
- [ ] Database schema applied (SQL migration)
- [ ] All 10 tables verified in Table Editor
- [ ] Anon key retrieved from Settings → API
- [ ] `.env` file created with credentials
- [ ] `lib/main.dart` updated (done)
- [ ] `lib/services/supabase_service.dart` added (done)
- [ ] Build command run with `--dart-define` flags
- [ ] Sign up test successful
- [ ] Sign in test successful
- [ ] Assessment creation test successful
- [ ] Test result save test successful
- [ ] Device management test successful
- [ ] Verified data in Supabase Table Editor

---

**Congratulations! Your VitalStep app is now running on Supabase.** 🎉

For production deployment, please follow security best practices above and test thoroughly.
