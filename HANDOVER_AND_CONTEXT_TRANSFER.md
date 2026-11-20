# VitalStep — Comprehensive Project Handover & Context Transfer

> **Purpose**: This document preserves the complete context, architectural state, database credentials, active test accounts, recent code changes, and remaining action items for the **VitalStep** project.  
> When opening this project on another machine (e.g., Home PC with Google Antigravity), give this document to the assistant to resume work seamlessly with zero loss of context.

---

## 1. Project Overview & Architecture

**VitalStep** is a smart palm-pressure and grip-strength monitoring system consisting of:
1. **IoT Hardware / Firmware**: ESP32 microcontroller with palm pressure sensors, SD card reader, TFT display, and WiFi/BLE connectivity.
2. **Mobile Application**: Cross-platform Flutter app utilizing the **Stacked Architecture** (MVVM) and GetStorage.
3. **Cloud Backend**: Supabase (PostgreSQL, Row Level Security, Auth, Storage, and Edge Functions).

### Repository & Mirror Requirement
- **Primary Workspace**: `vitalstep_with_firmware-master/`
- **Mirror Copy**: `vitalstep_firmware_COPY-main/`
- ⚠️ **Critical Rule**: All modifications made to any file in the primary workspace **MUST be mirrored** to `vitalstep_firmware_COPY-main/`.

---

## 2. Supabase Backend & Credentials

- **Project URL**: `https://oyqecdcpicvzwwvwaeka.supabase.co`
- **Publishable / Anon Key**:
  - Configured via `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Environment Variables and `.env.local` (obtained from Supabase Dashboard → Project Settings → API Keys).
- **Service Role Secret Key** (backend/admin operations only, do not expose in client code):
  - Configured via `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables and `.env.local` (obtained from Supabase Dashboard -> Project Settings -> API Keys).
- **SQL Dashboard**: [https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/sql](https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/sql)
- **Table Editor**: [https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/editor](https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/editor)

---

## 3. Active Test Accounts & Entities (Live State)

### A. Patient Account
- **Name**: Sandip R
- **Email**: `sandipr@hotmail.com`
- **Password**: `Sandip@202`
- **Auth UID**: `3714e805-a06e-4ac1-9a5d-1289cd627baa`
- **Patient Table ID**: `c29eb4ad-e28d-4be4-8c5c-09428fa53526`
- **Patient Code (Access Code)**: `PT-3714` (also rendered as a QR code in the Account tab)
- **Dominant Hand**: `'R'` (clinical table) / `'Right'` (profile display)
- **Role**: `Patient`

### B. Specialist Account
- **Name**: Dr. Chandan Reddy
- **Email**: `nncr540@gmail.com`
- **Password**: `password123`
- **Auth UID**: `a31f763e-a72c-4701-b522-3adf5dd4c0f5`
- **Specialist Table ID**: `cd9fd441-575c-41d0-969f-ef5847cd8c9e`
- **Phone**: `9942814286`
- **Role**: `Specialist`

### C. Admin Account (Manufacturing & Device Inventory Dashboard)
- **Email**: `admin@vitalstep.com`
- **Password**: `Admin@123`
- **Auth UID**: `09c41189-b0c7-4dc0-b9f9-153162041dfa`
- **Role**: `device_manager`
- **Admin Dashboard**: `admin-dashboard-nextjs` (`http://localhost:3000/login`)

### C. Active Linkage (`specialist_access`)
- **Row ID**: `6e9000e9-2840-4cc4-b2fb-c6634b233d7a`
- **Specialist ID**: `cd9fd441-575c-41d0-969f-ef5847cd8c9e` (Dr. Chandan Reddy)
- **Patient ID**: `c29eb4ad-e28d-4be4-8c5c-09428fa53526` (Sandip R)
- **Status**: Linked with `'view'` access level. Sandip R will appear on Dr. Chandan's patient list, and Dr. Chandan will appear under Sandip R's "Recent Specialists".

### D. Paired Hardware Device
- **Device Code**: `VS-001002`
- **Device Name**: `sandip home`
- **Device Table ID**: `7531bdae-5ada-4721-b9c3-0e2c58a5179b`
- **Paired User ID**: `3714e805-a06e-4ac1-9a5d-1289cd627baa` (Sandip R)
- **Device Secret**: `580c5a414a5de3e10252af8522b5b304890d3bfa1b2506872e3f5823571ed45d`
- **SD Card Files**: `/devicecode.txt` contains `VS-001002`, `/devicesecret.txt` contains the secret.

---

## 4. Comprehensive Changelog of Recent Work

Below is a detailed list of all bugs resolved and features added:

### 1. Device Pairing Fix (`lib/ui/views/device/device_viewmodel.dart`)
- **Issue**: Scanning the device QR code (`vitalstep://pair?code=VS-001002&pin=...`) caused an "Invalid Device" dialog because the entire URI was passed as the device code.
- **Fix**: Added URI parsing in `onQrScanned()` to extract only the `code=` parameter (`VS-001002`).
- **Fix**: In `lib/services/api_calls_service.dart`, removed `.eq('status', 'manufactured')` restriction from `getAllPossibleDevices()` so all valid registered device codes can pair.

### 2. Profile Loading & "Hello User" Crash (`lib/services/accounts_service.dart`)
- **Issue**: App crashed with `type 'String' is not a subtype of type 'num?' in type cast` and showed "Error Loading Profile" and "Hello, User".
- **Root Cause**: `Profile.fromJson()` failed because Supabase returns `profiles.id` as a UUID string (model expected `int`), and numeric fields like `weight_kg` / `height_cm` were returned as strings or doubles.
- **Fix**: Rewrote `getAccountDetails()` to bypass `Profile.fromJson()`. Added `_parseInt()` helper handling `String | num | null` safely. Mapped `patient_code` to `access_code` and `dominant_hand` from `'R'`/`'L'` to `'Right'`/`'Left'`.
- **Fix**: Updated `getDevices()` to check `device_pairings` table first, then `devices` table fallback.

### 3. Edge Function Sync (`supabase/functions/pair-device/index.ts`)
- Updated the `pair-device` edge function to upsert into both `device_pairings` and `devices` tables on pairing.

### 4. Specialist Sign-Up & Login Flow (`lib/services/specialist_service.dart` & `login_service.dart`)
- **Issue**: Specialist signup created records but left the user stranded on the signup screen.
- **Fix**: `signUp()` now saves session state (`userId`, `userType = 'Specialist'`, `userEmail`), shows success notification, and navigates immediately to `Routes.homeSpecialistView`.
- **Fix**: Guarded `DateTime.parse(profile.dob)` in `sign_up_specialist_viewmodel.dart` against empty strings so "Edit Profile" doesn't crash with `FormatException`.

### 5. Specialist Patient Linking & QR Code Scanning
- **Issue 1**: No QR code scanner on the specialist dashboard to scan the patient's card.
- **Issue 2**: Manual entry gave "Patient Not Found" because Supabase RLS on `patients` blocked specialists from viewing unlinked patients.
- **Fixes**:
  - **`lib/services/specialist_service.dart`**:
    - Added static helper `parsePatientCode(String raw)` extracting clean codes from raw strings or URIs.
    - Updated `addPatient()`: attempts calling `link_patient_to_specialist` RPC first (bypassing RLS), then falls back to case-insensitive direct search by code or email.
    - Implemented a 4-tier patient resolver in `createAssessment()` to handle UUIDs, patient codes, and fallbacks.
  - **`lib/ui/views/home_tab_specialist/home_tab_specialist_view.dart`**:
    - Added a **"Scan QR Code"** button with camera icon and an AppBar scanner icon.
    - Added bottom-sheet scanner view using `MobileScanner`.
    - Added clean empty-state UI when no patients are linked yet.
  - **`lib/ui/views/home_tab_specialist/home_tab_specialist_viewmodel.dart`**:
    - Added `onQrScanned(String rawCode)` which automatically links the patient and refreshes the list.
  - **`lib/ui/dialogs/add_patient/add_patient_dialog.dart` & `model.dart`**:
    - Added QR scan icon inside the "Access Code" field.
    - Allowed submitting with *either* access code OR email (instead of requiring both).

### 6. Supabase SQL & RLS Script (`FIX_SUPABASE_SCHEMA_AND_RLS.sql`)
- Created `is_specialist_for_patient()` and `is_patient_for_specialist()` SECURITY DEFINER functions.
- Created `link_patient_to_specialist(p_patient_code, p_patient_email)` SECURITY DEFINER RPC.
- Configured non-recursive RLS policies for `patients`, `specialists`, `specialist_access`, `assessment_queue`, and `remarks`.
- Seeded default assessments ("Baseline Palm Grip", "Standing Palm Grip", "Endurance Grip").

### 7. Firmware & Utilities
- **`VitalStep_Device_fixed.ino`**: Latest firmware with pairing state, QR display, touch input, 20ms debounce.
- **`VitalStep_Device_production.ino`**: Production build without hardcoded credentials.
- **`SD_CARD_READER_UTILITY.ino`**: Interactive SD card manager supporting `DUMP`, `READ`, `WRITE`, `PAIR`, `UNPAIR`, `SETID`, `DELETE` commands via Serial Monitor.

---

## 5. Architectural Gotchas & Coding Rules

1. **NEVER use `fromJson()` for Supabase database rows**:
   - The generated freezed models (`Profile.g.dart`, `Accounts.g.dart`, `Assessment.g.dart`) expect integer IDs, but Supabase uses UUID strings.
   - Always manually construct models (e.g. `Profile(...)`, `Accounts(...)`, `Assessment(...)`) using `.hashCode` or String conversions.
2. **Do not modify generated files**:
   - Never manually touch `*.g.dart` or `*.freezed.dart`.
3. **Always keep `vitalstep_firmware_COPY-main` in sync**:
   - Any file modified in `lib/` or root must be copied to `vitalstep_firmware_COPY-main/`.
4. **Verification before test**:
   - Run `flutter analyze <files>` to ensure 0 errors and 0 warnings before running.

---

## 6. How to Resume on Another Machine (Home PC)

### Step 1: Push Changes from this PC (Crucial!)
On this machine (before leaving), run:
```powershell
cd C:\Users\Appmaker\Documents\vitalstep_with_firmware-master
git add .
git commit -m "Fix device pairing, accounts service, specialist flow, and QR scanning"
git push
```

### Step 2: Pull on Home PC
On your home machine:
```powershell
git pull
flutter pub get
```

### Step 3: Run the SQL in Supabase (if not executed yet)
1. Open Supabase SQL Editor: [https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/sql](https://supabase.com/dashboard/project/oyqecdcpicvzwwvwaeka/sql)
2. Copy and execute the contents of `FIX_SUPABASE_SCHEMA_AND_RLS.sql`.

### Step 4: Prompt for the New Antigravity Agent
Start a new chat with Antigravity on your home PC and paste the following prompt:

```text
I have pulled the latest repo for VitalStep. Please read `HANDOVER_AND_CONTEXT_TRANSFER.md` in the repository root. It documents the entire system, credentials, active test accounts (Sandip R as patient, Dr. Chandan Reddy as specialist, VS-001002 device), recent fixes, and architectural rules. 
Please verify the current setup and let's continue with:
1. Verifying specialist dashboard and patient linking on the device/emulator.
2. Testing measurement data flow from ESP32 device into Supabase and verifying dashboard graphs.
```

---

## 7. Immediate Next Steps / Remaining Roadmap

1. **Test ESP32 -> Supabase -> App Data Flow**:
   - On the ESP32 device `VS-001002`, perform a test grip.
   - Device saves to `/vs/pending/*.json` on SD card.
   - Device triggers sync to `device-sync` edge function with headers `x-device-code: VS-001002` and `x-device-secret: 580c5a414a5de3e10252af8522b5b304890d3bfa1b2506872e3f5823571ed45d`.
   - Ensure `device_inventory` table has matching `device_secret` for `VS-001002`.
   - Confirm measurements populate into `measurements` table with device ID `7531bdae-5ada-4721-b9c3-0e2c58a5179b`.
   - Confirm patient's Dashboard graphs and test history update in real-time.
2. **Assign Assessment from Specialist**:
   - In Specialist dashboard, tap on Sandip R.
   - Tap "Create Assessment" -> assign a test (e.g., "Daily", "sitting").
   - Confirm row is inserted in `assessment_queue`.
   - Verify that ESP32 device receives the queued assessment during its next sync cycle.
