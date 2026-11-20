import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get_storage/get_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vital_step/ReceivedNotification.dart';
import 'package:vital_step/app/app.bottomsheets.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.router.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/services/device_selection_service.dart';
import 'package:vital_step/services/notifications_service.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();
final StreamController<ReceivedNotification> didReceiveLocalNotificationStream =
    StreamController<ReceivedNotification>.broadcast();

/// Main VitalStep Supabase client — used for all patient, specialist,
/// assessment, and device data.
late final SupabaseClient patientSupabaseClient;

/// Legacy Supabase client — fallback for legacy kill-switch checks
late final SupabaseClient legacySupabaseClient;

@pragma('vm:entry-point')
void notificationTapBackground(
    NotificationResponse notificationResponse) async {
  await StackedService.navigatorKey?.currentState
      ?.pushNamed(Routes.assesmentView);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupLocator();
  setupDialogUi();

  // ─── INITIALIZE MAIN VITALSTEP SUPABASE (with Flutter storage) ──────────
  // Project: oyqecdcpicvzwwvwaeka (vitalstep-device-sync-v2)
  // Initializes GotrueAsyncStorage, SharedPreferences, and auth state management
  await Supabase.initialize(
    url: 'https://oyqecdcpicvzwwvwaeka.supabase.co',
    anonKey: 'sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**',
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.implicit,
    ),
  );
  patientSupabaseClient = Supabase.instance.client;

  // ─── LEGACY KILL-SWITCH CLIENT (read-only fallback) ────────────────────
  legacySupabaseClient = SupabaseClient(
    'https://aoujgxqgixpanztyyshc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdWpneHFnaXhwYW56dHl5c2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMxOTc3ODQsImV4cCI6MjAzODc3Mzc4NH0.7oZoJa7kYpIjj48dOI_iamjxLlMqv_pek52RswBtpRs',
  );

  setupBottomSheetUi();
  await GetStorage.init();

  // Initialize DeviceSelectionService
  final deviceSelectionService = locator<DeviceSelectionService>();
  await deviceSelectionService.initialize();

  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings("@mipmap/ic_launcher");

  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );

  final NotificationsService notificationsService =
      locator<NotificationsService>();
  notificationsService.handleNotification();

  // For terminated state
  final NotificationAppLaunchDetails? notificationAppLaunchDetails =
      await flutterLocalNotificationsPlugin.getNotificationAppLaunchDetails();
  String initialRoute = Routes.startupView;

  final response = notificationAppLaunchDetails?.notificationResponse;
  if (response != null) {
    initialRoute = Routes.assesmentView;
  }

  runApp(MainApp(initialRoute: initialRoute));

  // For foreground and background
  await flutterLocalNotificationsPlugin.initialize(initializationSettings,
      onDidReceiveNotificationResponse:
          (NotificationResponse notificationResponse) async {
    await notificationsService.handleNotification();
  }, onDidReceiveBackgroundNotificationResponse: notificationTapBackground);
}

class MainApp extends StatelessWidget {
  const MainApp({super.key, required this.initialRoute});
  final String initialRoute;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: initialRoute,
      theme: ThemeData(
        primaryColor: const Color(0xFF0D9488), // VitalStep teal
      ),
      onGenerateRoute: StackedRouter().onGenerateRoute,
      navigatorKey: StackedService.navigatorKey,
      navigatorObservers: [
        StackedService.routeObserver,
      ],
    );
  }
}
