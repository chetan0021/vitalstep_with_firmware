# VitalStep Mobile App

A modern, feature-rich Flutter application for monitoring palm pressure health with vibrant colors and professional UI.

## Features

### 🔐 Authentication
- Secure email/password authentication via Supabase
- User account management
- Demo mode for quick testing
- Password reset functionality

### 📱 Device Management
- Pair multiple VitalStep devices
- Real-time device status monitoring
- Battery level tracking
- Last sync timestamp
- Device renaming and unpairing
- Test data generation for development

### 📊 Measurement Recording
- Guided 4-step measurement process
- Three trials per test for accuracy
- Hand and posture selection
- Peak and average reading calculations
- Offline data queuing

### 📈 Data & Analytics
- Complete measurement history
- Filtering by hand and date range
- Trending analysis
- Comparative metrics (L vs R)
- Export functionality (coming soon)

### 💡 Health Insights
- AI-powered data analysis
- Severity classification (Normal → Severe)
- Personalized recommendations
- Trend identification
- Asymmetry detection

### ⚙️ Settings & Preferences
- Notification preferences
- Auto-sync configuration
- Account management
- Privacy and terms

## Color Palette

The app uses a **vibrant, professional color scheme**:

```dart
// Primary Colors
primary:      #1E90FF (Dodger Blue)
accent:       #C870FF (Vibrant Purple)
success:      #50FF96 (Vibrant Green)
warning:      #FFDC50 (Vibrant Gold)
error:        #FF5068 (Vibrant Red)

// Hand-Specific
leftHand:     #00E6C8 (Teal)
rightHand:    #B464FF (Purple)

// Background
background:   #0A0F23 (Deep Blue-Black)
surface:      #161D3D (Slightly Lighter)
```

## Architecture

The app follows a **Provider-based state management** architecture:

```
main.dart
├── AuthProvider                  # User authentication
├── DeviceProvider               # Device management
├── MeasurementProvider          # Measurement data
└── SupabaseService              # Backend integration
    └── Supabase API
```

## Screen Structure

```
AuthWrapper
├── LoginScreen
├── SignupScreen
└── HomeScreen (when authenticated)
    ├── Device Management
    ├── Quick Actions
    └── Navigation to:
        ├── DeviceDetailScreen
        ├── DevicePairingScreen
        ├── MeasurementScreen
        ├── HistoryScreen
        ├── InsightsScreen
        └── SettingsScreen
```

## Getting Started

### Prerequisites
- Flutter 3.0+ with iOS/Android SDKs
- Dart 3.0+
- Xcode (iOS) or Android Studio (Android)

### Installation

1. **Navigate to project directory**
   ```bash
   cd VitalStep_Mobile_App
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run on emulator/device**
   ```bash
   # List available devices
   flutter devices
   
   # Run
   flutter run
   
   # Run with specific device
   flutter run -d <device_id>
   ```

### Configuration

The app connects to Supabase. Credentials are in `lib/services/supabase_service.dart`:

```dart
await Supabase.initialize(
  url: 'https://oyqecdcpicvzwwvwaeka.supabase.co',
  anonKey: 'sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi',
);
```

## Demo Mode

Quick way to test without real data:

1. On login screen, click **"Demo Mode (Test Data)"**
2. Auto-fills with: `demo@vitalstep.com` / `Demo123!`
3. App generates sample measurements
4. Explore all features with pre-populated data

## Building for Production

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### iOS App
```bash
flutter build ios --release
# Output: build/ios/iphoneos/Runner.app
```

### Web (Optional)
```bash
flutter build web --release
# Output: build/web/
```

## Project Structure

```
lib/
├── main.dart                       # App entry & providers
├── theme/
│   ├── colors.dart                # Color palette
│   └── app_theme.dart             # Material 3 theme
├── models/
│   └── device.dart                # Data models
├── services/
│   └── supabase_service.dart      # API integration
├── screens/
│   ├── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── signup_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── device/
│   │   ├── device_detail_screen.dart
│   │   └── device_pairing_screen.dart
│   ├── measurement/
│   │   └── measurement_screen.dart
│   ├── history/
│   │   └── history_screen.dart
│   ├── insights/
│   │   └── insights_screen.dart
│   └── settings/
│       └── settings_screen.dart
└── providers/
    ├── auth_provider.dart
    ├── device_provider.dart
    └── measurement_provider.dart
```

## Dependencies

### Core
- `flutter` - UI framework
- `provider` - State management
- `supabase_flutter` - Backend integration

### UI
- `google_fonts` - Typography
- `flutter_animate` - Animations
- `fl_chart` - Data visualization
- `shimmer` - Loading effects

### Data
- `json_annotation` - JSON serialization
- `shared_preferences` - Local storage
- `hive` - NoSQL local database

### Utilities
- `http` / `dio` - HTTP clients
- `intl` - Internationalization
- `logger` - Logging
- `uuid` - ID generation

## Testing

### Unit Tests
```bash
flutter test
```

### Widget Tests
```bash
flutter test test/widgets/
```

### Integration Tests
```bash
flutter test integration_test/
```

## Development Tips

### Hot Reload
```bash
# Press 'r' in terminal to hot reload
# Press 'R' to fully restart
```

### Debug Mode
```bash
flutter run --verbose
```

### Analyze Code
```bash
flutter analyze
```

### Format Code
```bash
flutter format lib/
```

## Performance Optimization

- Images are lazy-loaded
- Provider pattern prevents unnecessary rebuilds
- Supabase queries are cached where possible
- Measurement data is paginated

## Accessibility

- Material Design 3 components
- Proper contrast ratios
- Semantic labels for all interactive elements
- Support for system text scaling

## API Integration

All backend calls go through `SupabaseService`:

```dart
// Example: Get devices
final devices = await SupabaseService().getDevices();

// Example: Create measurement
await SupabaseService().saveMeasurement(measurement);

// Example: Real-time updates
final channel = SupabaseService().subscribeToDeviceUpdates(deviceId);
```

## Troubleshooting

### App crashes on startup
- Clear build cache: `flutter clean`
- Delete pubspec.lock: `rm pubspec.lock`
- Reinstall: `flutter pub get`

### Supabase connection issues
- Check internet connection
- Verify Supabase URL in credentials
- Check API key validity
- Ensure RLS policies allow access

### UI rendering issues
- Clear device cache
- Restart emulator/device
- Check for layout overflow errors in console

## Future Enhancements

- [ ] QR code scanner for device pairing
- [ ] Real-time chart updates
- [ ] Offline mode with sync queue
- [ ] Push notifications
- [ ] Data export (PDF/CSV)
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Biometric authentication
- [ ] Cloud backup

## Contributing

1. Create feature branch: `git checkout -b feature/xyz`
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - VitalStep

## Support

For issues or questions:
- Check the main project README
- Review Supabase documentation
- Inspect debug logs: `flutter logs`

---

**Version:** 1.0.0  
**Last Updated:** November 2026  
**Maintainer:** VitalStep Team
