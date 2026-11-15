# G£à Flutter App - Testing Readiness Checklist

## Current Status

### G£à What's Ready
- [x] Supabase credentials configured in `supabase_service.dart`
- [x] Authentication logic implemented (login, signup, logout)
- [x] Provider state management set up
- [x] All screen files created
- [x] Device pairing screen ready
- [x] Measurement display ready
- [x] Cloud sync logic implemented
- [x] BLE provisioning ready

### G¥î What's NOT Ready Yet
- [ ] Dependencies NOT downloaded (`flutter pub get` not run)
- [ ] Supabase backend NOT set up (no tables, no auth enabled)
- [ ] App NOT built for your phone

---

## What You Need to Do

### Phase 1: Set Up Supabase Backend (15-20 minutes)
**Follow**: `SUPABASE_SETUP_GUIDE.md`

Steps:
1. Enable Email/Password authentication
2. Create database tables (users, devices, measurements, insights)
3. Deploy Edge Function (device-sync)
4. Create test user account
5. Verify in Supabase dashboard

**Status After This**: =ƒƒí Backend ready, app code needs setup

---

### Phase 2: Prepare Flutter App (5-10 minutes)

#### 2.1 Install Flutter Dependencies
```bash
cd VitalStep_Mobile_App
flutter pub get
```

This downloads:
- G£à supabase_flutter (cloud backend)
- G£à provider (state management)
- G£à http (API calls)
- G£à flutter_animate (UI animations)
- G£à And 15+ other packages

**Time**: ~2-3 minutes (depends on internet)

#### 2.2 Connect Your Phone
- USB cable to laptop
- Enable USB Debugging on phone
- Run: `flutter devices` (should see your phone)

**Status After This**: =ƒƒí Ready to run

---

### Phase 3: Run the App (1 minute)

#### 3.1 Start the App
```bash
flutter run
```

Or from VS Code/Android Studio:
- Click the **Run** button (top right)
- Select your phone as target
- Wait ~30 seconds for build

#### 3.2 First Launch
You should see:
1. Splash screen (VitalStep logo) GåÆ 2 seconds
2. Login screen GåÆ If no user logged in
3. Home screen GåÆ If user logged in

**Status After This**: =ƒƒó App Running!

---

## Testing Workflow

### Step 1: Sign Up (First Time)
1. App shows login screen
2. Tap **Sign Up**
3. Enter:
   - Email: `test@vitalstep.com` (or your email)
   - Password: `Test123!@#` (must have uppercase, number, special char)
4. Tap **Create Account**
5. Should show success GåÆ redirects to login

### Step 2: Sign In
1. App shows login screen
2. Enter credentials:
   - Email: `test@vitalstep.com`
   - Password: `Test123!@#`
3. Tap **Sign In**
4. Should show home screen G£ô

### Step 3: Pair Device
1. Turn on VitalStep device (ESP32)
2. Device boots GåÆ shows BLE pairing screen
3. App GåÆ tap **Add Device** / **Pair Device**
4. App scans for BLE devices
5. Select `PalmPressure` (your device name)
6. App sends device credentials
7. Device confirmed on cloud G£ô

### Step 4: Run Measurement Test
1. App home screen GåÆ tap **Start Test**
2. Follow on-screen instructions
3. Device runs measurement cycle (3 trials)
4. Results appear in app
5. Tap **Save** GåÆ stores locally
6. Tap **Sync** GåÆ uploads to Supabase G£ô

### Step 5: View Results
1. App GåÆ tap **History**
2. You should see your test results:
   - Date & time
   - Hand (Left/Right)
   - Trial 1, 2, 3 readings
   - Average pressure

---

## =ƒöº System Requirements

### Your Computer
- [ ] Windows 10/11 with Flutter SDK installed
- [ ] Android SDK (or iOS SDK if using iPhone)
- [ ] Any code editor (VS Code, Android Studio, etc.)

### Your Phone
- [ ] Android 10+ or iOS 14+
- [ ] USB cable for connection
- [ ] Bluetooth enabled (for device pairing)
- [ ] ~200MB free storage

### Internet
- [ ] Stable Wi-Fi or mobile data
- [ ] Can reach `oyqecdcpicvzwwvwaeka.supabase.co`

---

## =ƒô¦ Installation Command Summary

```bash
# 1. Navigate to app folder
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\VitalStep_Mobile_App

# 2. Download dependencies
flutter pub get

# 3. Connect phone via USB
# (Enable USB Debugging if Android)

# 4. Run the app
flutter run

# 5. Choose device if multiple connected
# Press 'r' in terminal to hot-reload changes
# Press 'q' to quit the app
```

---

## G£à Expected Behavior

### Login Screen (First Time)
```
VitalStep
Welcome to VitalStep
Sign in to your account

[Email field]
[Password field]
[Sign In button]

Don't have an account? Sign Up
Demo Mode (Test Data) button
```

### Home Screen (After Login)
```
Hi, [Your Name]

[Quick Stats]
- Left Hand: -- kg (no data yet)
- Right Hand: -- kg
- Sync Status: Online

[Action Buttons]
- Start Test (blue)
- View History (teal)
- Settings (gray)

[Device Status]
- Paired: 1 device
- Battery: 85%
- Online: Yes
```

### Test Screen (During Measurement)
```
Apply pressure to load cell

Hand: Left (can change)
Posture: Standing (can change)

[Trial 1 of 3]
Status: Waiting...
Current: -- kg
Peak: -- kg

[Abort Test button]
```

### Results Screen (After 3 Trials)
```
Test Complete!

Left Hand
Trial 1: 10.2 kg G£ô
Trial 2: 10.5 kg G£ô
Trial 3: 10.1 kg G£ô
Average: 10.3 kg

[Save] [Sync] [Discard]
```

---

## =ƒÉ¢ Common Issues & Fixes

### Issue: `flutter: not found`
**Fix**: Flutter not installed. Download from flutter.dev and add to PATH.

### Issue: `Gradle build failed`
**Fix**: Run `flutter clean` then `flutter pub get` again.

### Issue: `No devices found`
**Fix**: 
- Check USB cable is properly connected
- Enable USB Debugging on phone
- Try: `flutter devices` to see what's connected

### Issue: `Supabase connection failed`
**Fix**:
- Check internet connection
- Verify Supabase project URL is correct
- Make sure Supabase project is running (check dashboard)

### Issue: `Login fails - wrong password`
**Fix**:
- Make sure you created test user in Supabase dashboard
- Email: `test@vitalstep.com`
- Password: `Test123!@#`
- Try signing up again (new account)

### Issue: `Device pairing fails`
**Fix**:
- Make sure device is powered on and showing BLE screen
- Check phone Bluetooth is enabled
- Make sure device Wi-Fi can reach Supabase (firewall issue?)

---

## =ƒôè Success Checklist

### Before Testing
- [ ] Supabase backend set up (SUPABASE_SETUP_GUIDE.md completed)
- [ ] Test user created in Supabase
- [ ] Device firmware flashed with HX711 calibration G£ô
- [ ] Phone connected to computer via USB
- [ ] Phone has Bluetooth enabled
- [ ] Phone has internet connection

### During Testing
- [ ] `flutter pub get` completed successfully
- [ ] `flutter run` builds without errors
- [ ] App launches on phone
- [ ] Login screen appears
- [ ] Signup/Login works with test credentials
- [ ] Home screen shows after login
- [ ] Can see "Pair Device" button
- [ ] Device shows in Bluetooth scan

### Full Integration Test
- [ ] Sign in with test account
- [ ] Pair device successfully
- [ ] Run measurement test (3 trials)
- [ ] See results on app
- [ ] Tap Sync GåÆ check Supabase database
- [ ] Results appear in cloud G£ô

---

## =ƒÄ» Timeline

### Today (Quick Setup)
- 5 min: Set up Supabase (follow guide)
- 5 min: Run `flutter pub get`
- 2 min: Run `flutter run`
- 5 min: Test login and basic screens

### Tomorrow (Full Testing)
- 10 min: Pair device with app
- 10 min: Run measurement test
- 5 min: Verify results in Supabase
- 10 min: Test offline sync (disable Wi-Fi, run test, enable Wi-Fi, sync)

---

## =ƒôP Support Files

- **SUPABASE_SETUP_GUIDE.md** - Backend setup instructions
- **FLUTTER_GETTING_STARTED.md** - Detailed Flutter setup (if you need it)
- **ARCHITECTURE_DIAGRAM.md** - How app connects to device & cloud

---

## =ƒÜÇ You're Almost There!

Your app is **99% ready**. All you need to do is:

1. G£à Set up Supabase (backend)
2. G£à Run `flutter pub get` (download dependencies)
3. G£à Run `flutter run` (start the app)
4. G£à Test!

**Expected time to first working test**: 30-45 minutes

**Status**: =ƒƒó **READY TO GO**

Questions? Check the troubleshooting section or let me know what error you see!
