# ✅ VitalStep Firmware - READY FOR TESTING

## Summary

Both firmware files have been updated with your **calibrated load cell factor: 13.746 counts/gram (13746 counts/kg)**

```
BEFORE:  HX_DEFAULT_SCALE = 10300.0f  ❌ (incorrect)
AFTER:   HX_DEFAULT_SCALE = 13746.0f  ✅ (calibrated from your HX711 tool)
```

---

## What You Have Now

### VitalStep_Device_fixed.ino
**Purpose**: Development & Testing with mock sensor data

| Component | Setting | What Happens |
|---|---|---|
| Load Cell | MOCK_HX711=1 | Simulates realistic pressure (8-14 kg) |
| Battery | MOCK_BATTERY=1 | Shows 85% charge |
| SD Card | REAL_SD=1 | Real file storage (test results, queue) |
| Wi-Fi | Hardcoded SSID | Uses "redmi10A" + "897654321" |
| Speaker | MOCK_BUZZER=1 | No sound output |
| **Calibration Factor** | **13746** | **✅ UPDATED** |

**When you run this**:
1. Device boots → Shows UI with buttons
2. Press "Test" → Simulates realistic pressure curve (8-14 kg)
3. After 3 trials → Results save to SD card `/vs/pending/`
4. Tap "Sync" → Results upload to Supabase cloud
5. All buttons respond instantly (yield points active)

**Good for**: Testing UI, cloud sync, offline queue, without needing hardware

---

### VitalStep_Device_production.ino
**Purpose**: Production ready - real sensors, BLE provisioning

| Component | Setting | What Happens |
|---|---|---|
| Load Cell | MOCK_HX711=0 | **Real HX711 sensor** reads actual pressure |
| Battery | MOCK_BATTERY=0 | **Real ADC** reads battery voltage |
| SD Card | REAL_SD=1 | Real file storage |
| Wi-Fi | BLE Provisioned | App provides credentials over Bluetooth |
| Speaker | MOCK_BUZZER=0 | **Real sound** output on GPIO26 |
| **Calibration Factor** | **13746** | **✅ UPDATED** |

**When you run this**:
1. Device boots → Shows BLE pairing screen
2. Scan with app → Choose Wi-Fi network
3. App sends credentials → Device connects
4. Press "Test" → **Real load cell reads** actual palm pressure
5. After 3 trials → Results save + upload to Supabase
6. Battery shows actual pack voltage

**Good for**: Real usage with actual measurements and cloud sync

---

## 🎯 Testing Plan

### Phase 1: UI + Offline Testing (Today - using fixed.ino)
```
1. Flash VitalStep_Device_fixed.ino to ESP32
2. Power on → UI loads
3. Test all screens (home, dashboard, settings)
4. Run a test cycle (should show mock 8-14 kg pressure)
5. Check that all buttons respond instantly
6. Check SD card has files in /vs/pending/
   - Offline queue works ✅
   - UI responsive ✅
   - Calibration factor applied ✅
```

### Phase 2: Cloud Sync Testing (When ready - still fixed.ino)
```
1. Connect Wi-Fi (hardcoded in firmware)
2. Run another test cycle
3. Press "Sync" button
4. Check Supabase database
   - Results appear in cloud ✅
   - Device ID matches ✅
   - Timestamps correct ✅
```

### Phase 3: Real Sensor Testing (When ready - switch to prod.ino)
```
1. Flash VitalStep_Device_production.ino
2. Device boots to BLE pairing
3. Use mobile app to send Wi-Fi credentials
4. Run a test cycle
5. Observe REAL pressure readings from load cell
   - Should match physical pressure applied ✅
   - Calibration factor working correctly ✅
   - Results save correctly ✅
```

### Phase 4: Battery Testing (Future - when divider tested)
```
1. Physical battery divider connected to IO35
2. Check battery % display
3. Verify charging/discharging detection
```

---

## 📊 Expected Behavior

### Mock Mode (fixed.ino)
When you run a test:
```
1. Press "Test" button
2. Screen shows: "Apply pressure..."
3. Simulated data ramps from 0 → 8-14 kg over 1.2 seconds
4. Data stays stable
5. After 3 trials, shows results:
   - Trial 1: ~9.2 kg
   - Trial 2: ~10.5 kg
   - Trial 3: ~8.7 kg
   (values change each run - realistic variation)
6. Press "Save" → Results go to SD card
7. Press "Sync" → Results upload to Supabase
```

### Real Mode (prod.ino)
When you run a test:
```
1. Press "Test" button
2. Screen shows: "Apply pressure to load cell..."
3. As you press harder:
   - Reading increases from 0 → actual_pressure_kg
   - Real HX711 sensor reading (13.746 cal factor applied)
4. Release pressure → reading drops to 0
5. After 3 trials, shows results:
   - Trial 1: Your actual pressure
   - Trial 2: Your actual pressure
   - Trial 3: Your actual pressure
   (based on how hard you press)
6. Press "Save" → Results to SD card + cloud
```

---

## 🔍 Verification

### Before Flashing
✅ Calibration factor: **13.746** (not 10.3)
✅ Load cell pins: IO21 (DT), IO22 (SCK)
✅ SD card pins: IO5 (CS), IO18 (SCK), IO19 (MISO), IO23 (MOSI)
✅ Battery pin: IO35
✅ Yield points: In place (buttons responsive)
✅ Gradients: Optimized (fast rendering)

### After Flashing (fixed.ino)
1. Device boots → UI appears ✅
2. All buttons clickable → respond instantly ✅
3. Run test → mock 8-14 kg data appears ✅
4. Check `/vs/pending/` on SD → test files saved ✅
5. Cloud sync works → results in Supabase ✅

### After Flashing (prod.ino)
1. Device boots → BLE pairing screen ✅
2. App pairs & sends Wi-Fi → device connects ✅
3. Run test with load cell → real readings ✅
4. Results match calibration factor ✅
5. Cloud sync uploads real data ✅

---

## 🎚️ Calibration Factor Explanation

Your calibration from the tool showed:
```
1.010 kg on load cell
→ Raw delta: 13883 counts
→ Factor: 13883 / 1.010 = 13.746 counts/gram
→ In firmware: 13746 counts/kg (multiply by 1000)
```

Every kg of pressure = 13746 counts from HX711

This is now **baked into both firmware files**. When the load cell reads:
```
- 50000 counts → 50000 / 13746 = 3.64 kg
- 100000 counts → 100000 / 13746 = 7.27 kg
- 137460 counts → 137460 / 13746 = 10.0 kg (exactly 1 kg * 10000 counts)
```

---

## ✅ Checklist Before Flashing

- [ ] Read this entire document
- [ ] Have `VitalStep_Device_fixed.ino` ready (for testing)
- [ ] Or have `VitalStep_Device_production.ino` ready (for real use)
- [ ] ESP32-3248S035 board available
- [ ] USB cable for programming
- [ ] Arduino IDE with:
  - Board: ESP32 Dev Module
  - Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"
  - Required libraries: LovyanGFX, HX711 (bogde), ArduinoJson
- [ ] microSD card in the slot
- [ ] (Optional for prod.ino) Load cell connected to CN1 socket

---

## 🚀 Ready to Go!

**Status**: ✅ **READY FOR TESTING**

Both files are updated and ready to flash. Start with `fixed.ino` for testing, then move to `prod.ino` when ready for real hardware.

The calibration factor **13.746 counts/gram** will ensure accurate pressure measurements across your entire testing and production workflow.

---

**Questions?** Check:
- `SENSOR_CALIBRATION_AND_SETUP.md` - Detailed sensor reference
- `FINAL_FIX_ALL_SCREENS.md` - UI freeze fix details
- `BUG_FIX_CORRECTED.md` - Display corruption fix details
