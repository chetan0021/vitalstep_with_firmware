import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vital_step/Model/Device.dart';
import 'package:vital_step/Model/profile.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/services/login_service.dart';
import 'package:vital_step/services/supabase_service.dart';

class AccountsService {
  final LoginService _loginService = LoginService();
  final _box = GetStorage();
  final _logger = getLogger("AccountsService");

  // ─── PROFILE ───────────────────────────────────────────────────────────────

  Future<Profile> getAccountDetails({dynamic patientUserId}) async {
    try {
      final String userId = patientUserId?.toString() ?? (await _loginService.getUserId())!;

      // Try patients table first
      final data = await vitalstepSupabaseClient
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (data != null) {
        return Profile(
          name: data['name'],
          email: data['email'],
          countryCode: data['country_code'] ?? '+91',
          weight: data['weight_kg'] ?? 0,
          height: data['height_cm'] ?? 0,
          gender: data['gender'],
          dob: data['date_of_birth'],
          city: data['city'],
          country: data['country'],
          address: data['address'],
          dominantHand: data['dominant_hand'],
          palmLength: data['palm_length_mm'] != null ? (data['palm_length_mm'] / 10.0) : null,
          palmWidth: data['palm_width_mm'] != null ? (data['palm_width_mm'] / 10.0) : null,
          knucklesLength: data['knuckle_length_mm'] != null ? (data['knuckle_length_mm'] / 10.0) : null,
        );
      }

      // Fallback: return minimal profile from auth
      final user = vitalstepSupabaseClient.auth.currentUser;
      return Profile(
        name: user?.email ?? 'User',
        email: user?.email ?? '',
        countryCode: '+91',
        weight: 0,
        height: 0,
      );
    } catch (e) {
      _logger.e('getAccountDetails error: $e');
      rethrow;
    }
  }

  // ─── DEVICES ───────────────────────────────────────────────────────────────

  Future<List<Device>> getDevices() async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) return [];

      final data = await vitalstepSupabaseClient
          .from('devices')
          .select('*')
          .eq('user_id', userId);

      return (data as List).map((d) => Device(
        id: 0,
        userId: 0,
        deviceCode: d['device_code'] ?? '',
        deviceName: d['device_name'] ?? '',
      )).toList().cast<Device>();
    } catch (e) {
      _logger.e('getDevices error: $e');
      return [];
    }
  }

  Future<void> addDevice({required String deviceCode, required String deviceName}) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) throw Exception('Not logged in');

      // 1. Verify device_code exists in device_inventory
      final inventory = await vitalstepSupabaseClient
          .from('device_inventory')
          .select('id, status')
          .eq('device_code', deviceCode)
          .maybeSingle();

      if (inventory == null) {
        throw Exception('Device code not found. Please check and try again.');
      }

      if (inventory['status'] == 'paired') {
        throw Exception('This device is already paired to another account.');
      }

      // 2. Try to find existing profile record
      final existingProfile = await vitalstepSupabaseClient
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

      // 3. Create profile record if it doesn't exist (needed for devices FK)
      if (existingProfile == null) {
        final user = vitalstepSupabaseClient.auth.currentUser;
        await vitalstepSupabaseClient.from('profiles').upsert({
          'id': userId,
          'email': user?.email ?? '',
          'name': user?.email?.split('@')[0] ?? 'User',
          'user_type': 'Patient',
        });
      }

      // 4. Insert into devices table
      await vitalstepSupabaseClient.from('devices').insert({
        'user_id': userId,
        'device_code': deviceCode,
        'device_name': deviceName,
        'is_active': true,
      });

      // 5. Update device_inventory status to paired
      await vitalstepSupabaseClient
          .from('device_inventory')
          .update({
            'status': 'paired',
            'paired_user_id': userId,
            'paired_at': DateTime.now().toIso8601String(),
          })
          .eq('device_code', deviceCode);

      _logger.i('Device $deviceCode added successfully');
    } catch (e) {
      _logger.e('addDevice error: $e');
      rethrow;
    }
  }

  // ─── KILL SWITCH ──────────────────────────────────────────────────────────

  Future<bool> killApp() async {
    try {
      // Uses main Supabase instance (kill_switch table)
      final response = await vitalstepSupabaseClient
          .from('kill_switch')
          .select('is_enabled')
          .eq('feature_name', 'app')
          .maybeSingle()
          .timeout(const Duration(seconds: 3));

      if (response == null) return false;
      return !(response['is_enabled'] ?? true);
    } catch (e) {
      _logger.w('Kill switch check skipped: $e');
      return false;
    }
  }

  // ─── DELETE ACCOUNT ───────────────────────────────────────────────────────

  Future<void> deleteAccount() async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) return;

      // Delete from patients and devices tables
      await vitalstepSupabaseClient.from('devices').delete().eq('user_id', userId);
      await vitalstepSupabaseClient.from('patients').delete().eq('user_id', userId);

      await _loginService.signOut();
      Fluttertoast.showToast(msg: "Account deleted successfully");
    } catch (e) {
      _logger.e('deleteAccount error: $e');
      Fluttertoast.showToast(msg: "Unable to delete account. Please try again.");
    }
  }
}
