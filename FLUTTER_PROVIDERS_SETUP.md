# 📱 Flutter Providers Setup Guide

## What are Providers?

In your Flutter app, **Providers** are used for **state management** - managing data that multiple screens need to access.

Example: When user logs in, multiple screens need to know "who is logged in" (username, ID, etc.)

Instead of passing data through many screens, you use Providers to share it globally.

---

## Providers Already Set Up in Your App

Your `main.dart` already has these providers configured:

### 1. **SupabaseService Provider**
```dart
Provider<SupabaseService>(create: (_) => SupabaseService())
```
**Purpose**: Singleton instance of Supabase client
**Used by**: All screens that need cloud connection

### 2. **AuthProvider** (ChangeNotifierProvider)
```dart
ChangeNotifierProvider<AuthProvider>(
  create: (context) => AuthProvider(
    supabaseService: context.read<SupabaseService>(),
  ),
)
```
**Purpose**: Manages user authentication state
**Provides**:
- `signUp(email, password)` - Create account
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `currentUser` - Currently logged in user
- `isAuthenticated` - Bool: is user logged in?

### 3. **DeviceProvider** (ChangeNotifierProvider)
```dart
ChangeNotifierProvider<DeviceProvider>(
  create: (context) => DeviceProvider(
    supabaseService: context.read<SupabaseService>(),
  ),
)
```
**Purpose**: Manages paired devices
**Provides**:
- `getDevices()` - Get list of paired devices
- `pairDevice(code, secret)` - Pair new device
- `unpairDevice(deviceId)` - Remove paired device
- `currentDevice` - Selected device
- `deviceList` - All paired devices

### 4. **MeasurementProvider** (ChangeNotifierProvider)
```dart
ChangeNotifierProvider<MeasurementProvider>(
  create: (context) => MeasurementProvider(
    supabaseService: context.read<SupabaseService>(),
  ),
)
```
**Purpose**: Manages measurement test results
**Provides**:
- `startTest(hand, posture)` - Begin new measurement
- `addTrial(reading)` - Record trial result
- `saveMeasurement()` - Save to database
- `getMeasurements()` - Fetch history
- `currentTest` - Active test data

---

## How to USE Providers in Screens

### Example 1: Login Screen

**Reading a provider** (get current state):
```dart
// In build() method
@override
Widget build(BuildContext context) {
  final auth = context.read<AuthProvider>();  // Get provider
  
  return ElevatedButton(
    onPressed: () async {
      await auth.signIn(email, password);  // Use provider method
    },
    child: Text('Sign In'),
  );
}
```

**Listening to provider changes** (rebuild when state changes):
```dart
@override
Widget build(BuildContext context) {
  return Consumer<AuthProvider>(
    builder: (context, auth, child) {
      if (auth.isAuthenticated) {
        return HomeScreen();  // User logged in
      } else {
        return LoginScreen();  // Not logged in
      }
    },
  );
}
```

### Example 2: Home Screen

**Get current user info**:
```dart
@override
Widget build(BuildContext context) {
  final auth = context.read<AuthProvider>();
  final user = auth.currentUser;  // Get logged in user
  
  return Column(
    children: [
      Text('Hello, ${user.email}'),  // Show email
      // ...
    ],
  );
}
```

### Example 3: Device Pairing Screen

**Pair a device**:
```dart
onPressed: () async {
  final deviceProvider = context.read<DeviceProvider>();
  
  await deviceProvider.pairDevice(
    deviceCode: 'VS-12345',
    deviceSecret: 'secret...',
    deviceName: 'My VitalStep',
  );
  
  // Device now paired!
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Device paired successfully')),
  );
}
```

### Example 4: Measurement Test Screen

**Run a test**:
```dart
onPressed: () async {
  final measurement = context.read<MeasurementProvider>();
  
  // Start new test
  measurement.startTest(
    hand: 'L',  // Left hand
    posture: 'standing',
  );
  
  // Add trial results
  measurement.addTrial(9.5);  // First trial: 9.5 kg
  measurement.addTrial(9.8);  // Second trial: 9.8 kg
  measurement.addTrial(9.2);  // Third trial: 9.2 kg
  
  // Save to database
  await measurement.saveMeasurement();
}
```

---

## Where Providers are Located (in your code)

### main.dart
**File**: `VitalStep_Mobile_App/lib/main.dart`

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService().initialize();
  runApp(const VitalStepApp());
}

class _VitalStepAppState extends State<VitalStepApp> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(  // ← HERE: All providers defined
      providers: [
        Provider<SupabaseService>(create: (_) => SupabaseService()),
        ChangeNotifierProvider<AuthProvider>(
          create: (context) => AuthProvider(
            supabaseService: context.read<SupabaseService>(),
          ),
        ),
        ChangeNotifierProvider<DeviceProvider>(
          create: (context) => DeviceProvider(
            supabaseService: context.read<SupabaseService>(),
          ),
        ),
        ChangeNotifierProvider<MeasurementProvider>(
          create: (context) => MeasurementProvider(
            supabaseService: context.read<SupabaseService>(),
          ),
        ),
      ],
      child: MaterialApp(
        // ... rest of app
      ),
    );
  }
}
```

### Provider Classes Location
- **AuthProvider**: `VitalStep_Mobile_App/lib/providers/auth_provider.dart`
- **DeviceProvider**: `VitalStep_Mobile_App/lib/providers/device_provider.dart`
- **MeasurementProvider**: `VitalStep_Mobile_App/lib/providers/measurement_provider.dart`

---

## How Providers Connect to Supabase

```
Provider Tree:
│
├── SupabaseService (Supabase connection)
│   │
│   ├── AuthProvider (user login/signup)
│   │   └── Uses SupabaseService.client.auth.*
│   │
│   ├── DeviceProvider (device management)
│   │   └── Uses SupabaseService.client.from('devices').*
│   │
│   └── MeasurementProvider (test results)
│       └── Uses SupabaseService.client.from('measurements').*
│
└── All Screens
    └── Read from providers via context.read<>() or Consumer<>()
```

---

## Adding a New Provider (if needed)

**If you need to add a new provider** (for a new feature):

### 1. Create Provider Class

**File**: `VitalStep_Mobile_App/lib/providers/new_feature_provider.dart`

```dart
import 'package:flutter/foundation.dart';
import '../services/supabase_service.dart';

class NewFeatureProvider extends ChangeNotifier {
  final SupabaseService supabaseService;
  
  NewFeatureProvider({required this.supabaseService});
  
  // Your feature data
  String data = '';
  
  // Your feature methods
  Future<void> doSomething() async {
    // Use supabaseService here
    // Call notifyListeners() when data changes
    notifyListeners();
  }
}
```

### 2. Register in main.dart

```dart
MultiProvider(
  providers: [
    // ... existing providers
    ChangeNotifierProvider<NewFeatureProvider>(
      create: (context) => NewFeatureProvider(
        supabaseService: context.read<SupabaseService>(),
      ),
    ),  // ← Add this
  ],
  child: MaterialApp(...),
)
```

### 3. Use in Screens

```dart
final feature = context.read<NewFeatureProvider>();
await feature.doSomething();
```

---

## Common Provider Patterns

### Pattern 1: Check if User is Logged In

```dart
Consumer<AuthProvider>(
  builder: (context, auth, child) {
    return auth.isAuthenticated ? HomeScreen() : LoginScreen();
  },
)
```

### Pattern 2: Show Loading While Syncing

```dart
Consumer<MeasurementProvider>(
  builder: (context, measurement, child) {
    return measurement.isSyncing 
      ? CircularProgressIndicator()
      : ElevatedButton(
          onPressed: () => measurement.saveMeasurement(),
          child: Text('Save'),
        );
  },
)
```

### Pattern 3: Update UI When Data Changes

```dart
Consumer<DeviceProvider>(
  builder: (context, devices, child) {
    return ListView.builder(
      itemCount: devices.deviceList.length,
      itemBuilder: (context, index) {
        return ListTile(
          title: Text(devices.deviceList[index].name),
        );
      },
    );
  },
)
```

---

## Testing Providers (Debugging)

### Check Provider State

```dart
// In any screen
void debugProviders() {
  final auth = context.read<AuthProvider>();
  final devices = context.read<DeviceProvider>();
  final measurements = context.read<MeasurementProvider>();
  
  print('User: ${auth.currentUser?.email}');
  print('Devices: ${devices.deviceList.length}');
  print('Is authenticated: ${auth.isAuthenticated}');
}
```

### Add Print Statements

```dart
class AuthProvider extends ChangeNotifier {
  Future<void> signIn(String email, String password) async {
    print('🔐 Attempting login: $email');
    // ... login logic
    print('✅ Login successful!');
    notifyListeners();
  }
}
```

---

## Provider Best Practices

✅ **Do**:
- Use `context.read<>()` inside callbacks/button handlers
- Use `Consumer<>()` in build methods for reactive updates
- Call `notifyListeners()` when data changes
- Inject dependencies (Supabase) into providers

❌ **Don't**:
- Overuse `Consumer<>()` (can rebuild too often)
- Forget to call `notifyListeners()` after changing data
- Put UI logic in providers
- Create new provider instances each time

---

## Summary

Your app has **4 Providers already set up**:

| Provider | Purpose | Key Methods |
|---|---|---|
| **SupabaseService** | Cloud connection | initialize() |
| **AuthProvider** | User auth | signUp(), signIn(), signOut() |
| **DeviceProvider** | Device management | pairDevice(), getDevices() |
| **MeasurementProvider** | Test results | startTest(), addTrial(), save() |

**All providers are already in `main.dart` and ready to use!**

---

## Next: Use Providers in Your Screens

Now that you understand providers:

1. Open `VitalStep_Mobile_App/lib/screens/auth/login_screen.dart`
2. You'll see it uses `context.read<AuthProvider>()`
3. Same pattern in all other screens
4. Everything is already connected! ✓

---

## 📞 Quick Reference

**Get a provider**: `context.read<ProviderName>()`  
**Listen to changes**: `Consumer<ProviderName>(builder: ...)`  
**Notify of change**: `notifyListeners()`  
**Location**: `VitalStep_Mobile_App/lib/providers/*.dart`

✅ **Status**: All providers configured and ready to use!
