import 'package:flutter/foundation.dart';
import 'package:get_storage/get_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/main.dart';

/// Thin wrapper around [patientSupabaseClient] that provides
/// a single initialise entry-point and convenient helpers.
///
/// All database operations use [patientSupabaseClient] (the VitalStep project).
/// The kill-switch uses [Supabase.instance.client] (legacy project).
class SupabaseService {
  static final _logger = getLogger('SupabaseService');
  final _box = GetStorage();

  /// Kept for backward-compat – the client is already created in main.dart.
  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    // patientSupabaseClient is initialised in main() before this is called.
    _logger.i('SupabaseService ready (client initialised in main.dart)');
  }

  // ─── Convenience getters ─────────────────────────────────────────────────

  SupabaseClient get client => patientSupabaseClient;

  String? getCurrentUserId() => patientSupabaseClient.auth.currentUser?.id;
  String? getCurrentUserEmail() =>
      patientSupabaseClient.auth.currentUser?.email;

  // ─── Sign-out ────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    try {
      await patientSupabaseClient.auth.signOut();
      _box.erase();
      _logger.i('User signed out');
    } catch (e) {
      _logger.e('SignOut error: $e');
      rethrow;
    }
  }

  // ─── Kill-switch ─────────────────────────────────────────────────────────

  Future<bool> checkKillSwitch() async {
    try {
      // First try main project kill_switch table
      final mainResult = await patientSupabaseClient
          .from('kill_switch')
          .select('is_enabled')
          .eq('feature_name', 'app_active')
          .maybeSingle();
      if (mainResult != null) {
        return !(mainResult['is_enabled'] as bool? ?? true);
      }

      // Fallback to legacy client if needed
      final result = await legacySupabaseClient
          .from('vitalStep')
          .select('kill_switch')
          .eq('id', 1)
          .single();
      return (result['kill_switch'] as bool?) ?? false;
    } catch (e) {
      _logger.w('Kill switch check skipped: $e');
      return false;
    }
  }
}
