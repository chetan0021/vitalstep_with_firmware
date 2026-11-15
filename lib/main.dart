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
import 'package:vital_step/services/supabase_service.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();
final StreamController<ReceivedNotification> didReceiveLocalNotificationStream =
    StreamController<ReceivedNotification>.broadcast();

/// Kill-switch Supabase client (separate project)
/// Used only for remote app disable feature
late final SupabaseClient killSwitchSupabaseClient;

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

  // ─── INITIALIZE KILL-SWITCH SUPABASE ──────────────────────────────────
  // This is separate and only used for the kill-switch feature
  await Supabase.initialize(
    url: 'https://aoujgxqgixpanztyyshc.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdWpneHFnaXBhbnp0eXlzaGMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyMzE5Nzc4NCwiZXhwIjoyMDM4NzczNzg0fQ.7oZoJa7kYpIjj48dOI_iamjxLlMqv_pek52RswBtpRs',
  );
  killSwitchSupabaseClient = Supabase.instance.client;

  // ─── INITIALIZE MAIN VITALSTEP SUPABASE (YOUR NEW PROJECT) ────────────
  // Project: vitalstep-device-sync-v2
  // URL: https://oyqecdcpicvzwwwaeka.supabase.co
  // Publishable Key: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
  //
  // IMPORTANT: Get the ANON KEY from Supabase dashboard:
  // 1. Go to: https://supabase.com/dashboard/project/oyqecdcpicvzwwwaeka/settings/api
  // 2. Look for: Project API keys → anon/public
  // 3. Copy the full key (starts with "eyJ...")
  // 4. Pass it via: --dart-define=VITALSTEP_SUPABASE_ANON_KEY=<your_key>
  //
  // For now, using placeholder - UPDATE THIS WITH YOUR ACTUAL ANON KEY
  await SupabaseService.initialize(
    url: const String.fromEnvironment(
      'VITALSTEP_SUPABASE_URL',
      defaultValue: 'https://oyqecdcpicvzwwwaeka.supabase.co',
    ),
    anonKey: const String.fromEnvironment(
      'VITALSTEP_SUPABASE_ANON_KEY',
      defaultValue: 'YOUR_ANON_KEY_HERE', // TODO: Update with your actual anon key
    ),
  );

  setupBottomSheetUi();
  await GetStorage.init();

  // Initialize DeviceSelectionService
  final deviceSelectionService = locator<DeviceSelectionService>();
  await deviceSelectionService.initialize();

  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings("app_icon");

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
