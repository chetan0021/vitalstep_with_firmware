import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme/app_theme.dart';
import 'theme/colors.dart';
import 'services/supabase_service.dart';
import 'providers/auth_provider.dart';
import 'providers/device_provider.dart';
import 'providers/measurement_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/device/device_detail_screen.dart';
import 'screens/device/device_pairing_screen.dart';
import 'screens/measurement/measurement_screen.dart';
import 'screens/history/history_screen.dart';
import 'screens/insights/insights_screen.dart';
import 'screens/settings/settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseService().initialize();
  
  runApp(const VitalStepApp());
}

class VitalStepApp extends StatefulWidget {
  const VitalStepApp({Key? key}) : super(key: key);

  @override
  State<VitalStepApp> createState() => _VitalStepAppState();
}

class _VitalStepAppState extends State<VitalStepApp> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
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
            authProvider: context.read<AuthProvider>(),
          ),
        ),
        ChangeNotifierProvider<MeasurementProvider>(
          create: (context) => MeasurementProvider(
            supabaseService: context.read<SupabaseService>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'VitalStep',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        home: const AuthWrapper(),
        routes: {
          '/home': (context) => const HomeScreen(),
          '/login': (context) => const LoginScreen(),
          '/signup': (context) => const SignupScreen(),
          '/device-detail': (context) => const DeviceDetailScreen(),
          '/device-pairing': (context) => const DevicePairingScreen(),
          '/measurement': (context) => const MeasurementScreen(),
          '/history': (context) => const HistoryScreen(),
          '/insights': (context) => const InsightsScreen(),
          '/settings': (context) => const SettingsScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        // Show splash while checking auth status
        if (authProvider.isLoading) {
          return const SplashScreen();
        }

        // Route based on auth status
        if (authProvider.isAuthenticated) {
          return const HomeScreen();
        }

        return const LoginScreen();
      },
    );
  }
}

// ============================================================================
// PROVIDER CLASSES
// ============================================================================

class AuthProvider extends ChangeNotifier {
  final SupabaseService supabaseService;

  AuthProvider({required this.supabaseService}) {
    _initializeAuth();
  }

  bool _isLoading = true;
  bool _isAuthenticated = false;
  User? _currentUser;
  String? _error;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  User? get currentUser => _currentUser;
  String? get error => _error;

  Future<void> _initializeAuth() async {
    _isLoading = true;
    _currentUser = supabaseService.getCurrentUser();
    _isAuthenticated = _currentUser != null;
    _isLoading = false;
    notifyListeners();

    // Listen for auth state changes
    supabaseService.authStateChanges().listen((state) {
      _currentUser = state.session?.user;
      _isAuthenticated = _currentUser != null;
      notifyListeners();
    });
  }

  Future<void> signUp(String email, String password) async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      await supabaseService.signUp(email, password);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signIn(String email, String password) async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      await supabaseService.signIn(email, password);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      _error = null;
      await supabaseService.signOut();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      notifyListeners();
    }
  }
}

class DeviceProvider extends ChangeNotifier {
  final SupabaseService supabaseService;
  final AuthProvider authProvider;

  DeviceProvider({
    required this.supabaseService,
    required this.authProvider,
  }) {
    _initializeDevices();
  }

  List<Device> _devices = [];
  bool _isLoading = false;
  String? _error;
  Device? _selectedDevice;

  List<Device> get devices => _devices;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Device? get selectedDevice => _selectedDevice;

  Future<void> _initializeDevices() async {
    if (authProvider.isAuthenticated) {
      await loadDevices();
    }
  }

  Future<void> loadDevices() async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      _devices = await supabaseService.getDevices();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Device> pairDevice(String code, String name) async {
    try {
      _error = null;
      final user = authProvider.currentUser;
      if (user == null) throw Exception('Not authenticated');

      final device = await supabaseService.pairDevice(code, user.id, name);
      _devices.add(device);
      notifyListeners();
      return device;
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  void selectDevice(Device device) {
    _selectedDevice = device;
    notifyListeners();
  }

  Future<void> renameDevice(String deviceId, String newName) async {
    try {
      await supabaseService.renameDevice(deviceId, newName);
      final index = _devices.indexWhere((d) => d.id == deviceId);
      if (index >= 0) {
        _devices[index] = _devices[index]; // Trigger update
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> unpairDevice(String deviceId) async {
    try {
      await supabaseService.unpairDevice(deviceId);
      _devices.removeWhere((d) => d.id == deviceId);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }
}

class MeasurementProvider extends ChangeNotifier {
  final SupabaseService supabaseService;

  MeasurementProvider({required this.supabaseService});

  List<Measurement> _measurements = [];
  bool _isLoading = false;
  String? _error;

  List<Measurement> get measurements => _measurements;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadMeasurements(String deviceId) async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      _measurements = await supabaseService.getMeasurements(deviceId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMeasurementsByHand(String deviceId, String hand) async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      _measurements = await supabaseService.getMeasurementsByHand(deviceId, hand);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMeasurementsByDateRange(
    String deviceId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      _error = null;
      _isLoading = true;
      notifyListeners();

      _measurements =
          await supabaseService.getMeasurementsByDateRange(deviceId, startDate, endDate);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> saveMeasurement(Measurement measurement) async {
    try {
      _error = null;
      await supabaseService.saveMeasurement(measurement);
      _measurements.insert(0, measurement);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> generateTestData(String deviceId) async {
    try {
      await supabaseService.generateTestData(deviceId);
      await loadMeasurements(deviceId);
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }
}
