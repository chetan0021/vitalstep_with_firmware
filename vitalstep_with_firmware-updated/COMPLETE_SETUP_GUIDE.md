# VitalStep - Complete Setup & Deployment Guide

## Overview

VitalStep is a comprehensive palm pressure health monitoring system consisting of:
1. **ESP32 Firmware** - Standalone device with touchscreen UI, SD card storage, Bluetooth provisioning, and cloud sync
2. **Flutter Mobile App** - Full-featured iOS/Android application for device pairing, measurement recording, history tracking, and health insights
3. **Supabase Backend** - PostgreSQL database, authentication, and Edge Functions for cloud sync

---

## Phase 1: Device Firmware ✅ COMPLETE

### Current Status
- ✅ Firmware compiled and flashed to ESP32-3248S035
- ✅ Device connects to Wi-Fi successfully
- ✅ Cloud sync via Supabase Edge Function (HTTP 200)
- ✅ SD card storage initialized
- ✅ Touch UI with vibrant colors
- ✅ Test mode with simulated data

### File Location
```
VitalStep_Device_fixed.ino
```

### Configuration (Test Mode)
```cpp
#define TEST_MODE         1     // Simulate realistic data
#define MOCK_HX711        1     // Mock load cell
#define MOCK_BATTERY      1     // Mock battery (85%)
#define MOCK_BUZZER       1     // Skip speaker
#define REAL_SD           1     // Real SD card writes
```

### Hardware Pins (ESP32-3248S035)
```
Display: SPI2 (14, 13, 12, 15, 2, 27)
Touch:   XPT2046 (33 CS, 36 INT)
HX711:   GPIO 21 (DT), 22 (SCK)
Battery: GPIO 35 (ADC)
Speaker: GPIO 26
SD Card: VSPI (5 CS, 18 SCK, 19 MISO, 23 MOSI)
RGB LED: GPIO 4 (R), 16 (G), 17 (B)
```

### Colors (Enhanced Vibrant Palette)
- **Primary:** Dodger Blue (#1E90FF)
- **Secondary/Accent:** Vibrant Purple (#C870FF)
- **Success:** Vibrant Green (#50FF96)
- **Warning:** Vibrant Gold (#FFDC50)
- **Error:** Vibrant Red (#FF5068)
- **Hand Colors:** Teal (L), Purple (R)
- **Background:** Deep Blue-Black (#0A0F23)

### Next Steps for Hardware
1. Connect HX711 load cell (pins 21 DT, 22 SCK)
2. Connect battery divider (pin 35)
3. Connect speaker (pin 26)
4. Update firmware flags:
   ```cpp
   #define MOCK_HX711   0
   #define MOCK_BATTERY 0
   #define MOCK_BUZZER  0
   ```
5. Re-flash and test

---

## Phase 2: Mobile App 🆕 NEW

### Project Structure
```
VitalStep_Mobile_App/
├── lib/
│   ├── main.dart                 # App entry + providers
│   ├── theme/
│   │   ├── colors.dart          # Vibrant color palette
│   │   └── app_theme.dart       # Material 3 theme
│   ├── models/
│   │   └── device.dart          # Data models
│   ├── services/
│   │   └── supabase_service.dart # Backend integration
│   ├── screens/
│   │   ├── splash_screen.dart
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── signup_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   ├── device/
│   │   │   ├── device_detail_screen.dart
│   │   │   └── device_pairing_screen.dart
│   │   ├── measurement/
│   │   │   └── measurement_screen.dart
│   │   ├── history/
│   │   │   └── history_screen.dart
│   │   ├── insights/
│   │   │   └── insights_screen.dart
│   │   └── settings/
│   │       └── settings_screen.dart
│   └── providers/
│       ├── auth_provider.dart
│       ├── device_provider.dart
│       └── measurement_provider.dart
├── pubspec.yaml
└── assets/
```

### Key Features
1. **Authentication**
   - Email/password sign up and sign in
   - Secure session management via Supabase
   - Demo mode for quick testing

2. **Device Management**
   - Pair new devices using device code
   - View device status, battery, and sync info
   - Rename and unpair devices
   - Generate test data for development

3. **Measurement Recording**
   - Guided 4-step measurement process
   - Multiple trials per test (3x)
   - Hand and posture selection
   - Peak and average readings

4. **Data Visualization**
   - Measurement history with filters
   - Trending charts
   - Hand-specific comparisons
   - Date range selection

5. **Health Insights**
   - AI-powered analysis
   - Severity levels (Normal, Mild, Moderate, Severe)
   - Personalized recommendations
   - Trend tracking

6. **Settings**
   - Notification preferences
   - Auto-sync toggle
   - Account management
   - Privacy & terms

### Color Scheme (Matching Device)
- **Primary:** #1E90FF (Blue)
- **Accent:** #C870FF (Purple) 
- **Success:** #50FF96 (Green)
- **Warning:** #FFDC50 (Gold)
- **Error:** #FF5068 (Red)

### Setup Instructions

#### Prerequisites
- Flutter 3.0+ with iOS/Android SDKs
- Supabase account (already created)

#### Installation
```bash
cd VitalStep_Mobile_App

# Install dependencies
flutter pub get

# Run on device/emulator
flutter run

# Build APK (Android)
flutter build apk --release

# Build IPA (iOS)
flutter build ios --release
```

#### Configuration
Edit `lib/services/supabase_service.dart`:
```dart
await Supabase.initialize(
  url: 'https://oyqecdcpicvzwwvwaeka.supabase.co',
  anonKey: 'sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi',
);
```

### Demo Credentials
- Email: `demo@vitalstep.com`
- Password: `Demo123!`

---

## Phase 3: Supabase Backend ✅ COMPLETE

### Project Details
- **URL:** https://oyqecdcpicvzwwvwaeka.supabase.co
- **Publishable Key:** `sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi`
- **Region:** Asia (Singapore)

### Database Schema
```sql
-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  device_code TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  firmware_version TEXT,
  hardware_name TEXT,
  paired BOOLEAN DEFAULT FALSE,
  online BOOLEAN DEFAULT FALSE,
  battery_pct INTEGER DEFAULT -1,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Measurements
CREATE TABLE measurements (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  assessment_id TEXT,
  hand TEXT,
  posture TEXT,
  trials JSONB,
  peak_reading FLOAT,
  average_reading FLOAT,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY,
  assessment_id TEXT,
  device_id UUID REFERENCES devices(id),
  severity INTEGER,
  title TEXT,
  description TEXT,
  recommendation TEXT,
  asymmetry FLOAT,
  trend FLOAT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### Edge Function
**Location:** `/functions/v1/device-sync`

Handles:
- Device registration and pairing
- Cloud sync of measurements
- Data validation and storage
- Real-time updates

### Sample Test Call
```bash
curl -X POST "https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/device-sync" \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi" \
  -H "x-device-code: VS-92026" \
  -H "x-device-secret: 9e345bc38b7bc7186b72252c80a72f6635d35dc2c54991d74b5f38c17c5d7179" \
  -d '{
    "action": "sync",
    "pair_pin": "",
    "fw": "1.0.0",
    "hw": "VS-3248S035",
    "battery_pct": 85,
    "battery_v": 8.15,
    "charging": false,
    "rssi": -22,
    "device_time": 1731334800,
    "time_valid": true,
    "uptime_ms": 45000,
    "boot_id": "test123",
    "pending": 0,
    "measurements": []
  }'
```

---

## Test Mode - Running Without Hardware

### Enable Test Mode on Device
Edit `VitalStep_Device_fixed.ino`:
```cpp
#define TEST_MODE         1
#define MOCK_HX711        1
#define MOCK_BATTERY      1
#define MOCK_BUZZER       1
#define REAL_SD           1
```

Device will:
- Generate realistic pressure readings (8-15 kg)
- Simulate 3 trials per test
- Show varying readings across tests
- Save to SD card
- Sync to Supabase

### Using Demo Mode in App
1. Open app
2. Click "Demo Mode (Test Data)"
3. Auto-fills demo credentials
4. App generates sample measurements
5. View history and insights

---

## Production Deployment Checklist

### Device Firmware
- [ ] Connect real hardware (load cell, battery, speaker)
- [ ] Disable mock flags
- [ ] Calibrate load cell
- [ ] Test all sensors
- [ ] Verify SD card writes
- [ ] Enable TLS cert verification
- [ ] Add root CA certificate
- [ ] Test on production Wi-Fi
- [ ] Create firmware update mechanism

### Mobile App
- [ ] Add QR code scanner for device pairing
- [ ] Implement real measurement UI
- [ ] Add charts and graphs
- [ ] Implement data export (PDF/CSV)
- [ ] Add offline support
- [ ] Implement background sync
- [ ] Add push notifications
- [ ] Localization support
- [ ] App store deployment

### Backend
- [ ] Enable Row Level Security (RLS)
- [ ] Add rate limiting
- [ ] Implement backup strategy
- [ ] Set up monitoring/logging
- [ ] Create admin dashboard
- [ ] Add data retention policies
- [ ] Implement HIPAA compliance (if needed)
- [ ] Security audit

---

## Troubleshooting

### Device Not Connecting to Cloud
1. Check Wi-Fi SSID and password in firmware
2. Verify Supabase domain (typo-free): `oyqecdcpicvzwwvwaeka.supabase.co`
3. Check serial output for error codes
4. Ensure port 443 is not blocked by ISP
5. Try on different network (mobile hotspot)

### Mobile App Issues
1. Clear app cache: `flutter clean`
2. Rebuild: `flutter pub get && flutter run`
3. Check Supabase credentials in `supabase_service.dart`
4. Verify user is authenticated before pairing

### Device Not Pairing
1. Ensure device code matches database entry
2. Check device secret matches
3. Verify RLS policies allow access
4. Test Edge Function directly with curl

---

## File Locations

```
c:\Users\Chetan\Documents\vitalstep_with_firmware-master\
├── VitalStep_Device_fixed.ino              # Device firmware
├── VitalStep_Mobile_App/                   # Flutter app
│   ├── lib/main.dart                       # App entry point
│   ├── pubspec.yaml                        # Dependencies
│   └── ...
├── COMPLETE_SETUP_GUIDE.md                 # This file
└── ...
```

---

## Next Steps

1. **Immediate (Hardware Testing)**
   - Connect load cell, battery, speaker
   - Test device with real sensors
   - Verify cloud sync works

2. **Short Term (App Enhancement)**
   - Complete measurement recording UI
   - Add data visualization charts
   - Implement real-time device updates

3. **Medium Term (Features)**
   - QR code scanning
   - Data export
   - Offline mode
   - Push notifications

4. **Long Term (Production)**
   - Mobile app store deployment
   - Enterprise backend setup
   - Security audit
   - HIPAA compliance

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Flutter Docs:** https://flutter.dev/docs
- **ESP32 Resources:** https://www.espressif.com/
- **Device Display:** LovyanGFX library

---

## Build Info

**Firmware Version:** 1.0.0  
**Hardware:** ESP32-3248S035  
**App Version:** 1.0.0  
**Backend:** Supabase v2  
**Last Updated:** November 2026

---

Generated with ❤️ by VitalStep Team
