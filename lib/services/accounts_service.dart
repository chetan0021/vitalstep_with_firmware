import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vital_step/Model/Device.dart';
import 'package:vital_step/Model/profile.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/main.dart';

class AccountsService {
  final box = GetStorage();
  final _logger = getLogger("AccountsService");

  int _parseInt(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toInt();
    return num.tryParse(v.toString())?.toInt() ?? 0;
  }

  Future<Profile> getAccountDetails({String? patientUserId}) async {
    try {
      final uid = patientUserId ??
          patientSupabaseClient.auth.currentUser?.id ??
          box.read("userId")?.toString();

      // If absolutely no user ID found, fall back to cached values
      if (uid == null) {
        final cachedName = box.read<String>('user_name') ?? box.read<String>('userName') ?? 'User';
        return Profile(
          id: 0,
          name: cachedName,
          email: box.read<String>('user_email'),
          countryCode: '',
          weight: 0,
          height: 0,
          device: [],
        );
      }

      // Fetch minimal profile (id, name, email, user_type, dominant_hand) safely
      Map<String, dynamic>? profileData;
      try {
        profileData = await patientSupabaseClient
            .from('profiles')
            .select('id, name, email, user_type, dominant_hand')
            .eq('id', uid)
            .maybeSingle();
        if (profileData != null && profileData['name'] != null) {
          box.write('user_name', profileData['name'].toString());
          box.write('userName', profileData['name'].toString());
          box.write('user_email', profileData['email']?.toString());
          box.write('host_profile_name', profileData['name'].toString().split(' ')[0]);
        }
      } catch (e) {
        _logger.w('profiles query failed or missing: $e');
        profileData = null;
      }

      // Fetch full clinical data from patients table (may match user_id or id)
      Map<String, dynamic>? patientData;
      try {
        patientData = await patientSupabaseClient
            .from('patients')
            .select()
            .eq('user_id', uid)
            .maybeSingle();
        if (patientData != null) {
          box.write('patient_code', patientData['patient_code']?.toString());
          box.write('date_of_birth', patientData['date_of_birth']?.toString());
          box.write('weight_kg', patientData['weight_kg']);
          box.write('height_cm', patientData['height_cm']);
          box.write('dominant_hand', patientData['dominant_hand']?.toString());
          box.write('patient_phone', patientData['phone']?.toString());
        }
      } catch (e) {
        _logger.w('patients table query failed: $e');
        patientData = null;
      }

      // Fetch devices from device_pairings (the table the pair-device function writes to)
      List<dynamic> pairingsData = [];
      try {
        pairingsData = await patientSupabaseClient
            .from('device_pairings')
            .select('device_code, device_name, paired_at, is_active')
            .eq('user_id', uid)
            .eq('is_active', true);
      } catch (e) {
        _logger.w('device_pairings query failed: $e');
      }

      // Convert device_pairings rows to Device objects directly (bypasses fromJson)
      final devicesList = pairingsData.map((d) {
        return Device(
          id: (d['device_code'] ?? '').hashCode,
          userId: uid.hashCode,
          deviceName: (d['device_name'] ?? 'VitalStep Device').toString(),
          deviceCode: (d['device_code'] ?? '').toString(),
          createdAt: d['paired_at'] != null
              ? DateTime.tryParse(d['paired_at'].toString().replaceFirst(' ', 'T'))
              : null,
        );
      }).toList();

      // dominant_hand: patients table stores 'R'/'L'; map to 'Right'/'Left' for display
      String? dominantHand = profileData?['dominant_hand'] as String?;
      if (dominantHand == null && patientData != null) {
        final raw = patientData['dominant_hand'] as String?;
        dominantHand = raw == 'R' ? 'Right' : raw == 'L' ? 'Left' : raw;
      }
      if (dominantHand == null) {
        final cachedHand = box.read<String>('dominant_hand');
        dominantHand = cachedHand == 'R' ? 'Right' : cachedHand == 'L' ? 'Left' : cachedHand;
      }

      // Fallbacks from local cache if offline or restricted
      final fallbackName = box.read<String>('user_name') ?? box.read<String>('userName') ?? 'User';
      final fallbackEmail = box.read<String>('user_email');
      final fallbackPatientCode = box.read<String>('patient_code');
      final fallbackWeight = _parseInt(box.read('weight_kg'));
      final fallbackHeight = _parseInt(box.read('height_cm'));
      final fallbackDob = box.read<String>('date_of_birth');
      final fallbackPhone = box.read<String>('patient_phone');

      final finalWeight = _parseInt(patientData?['weight_kg']) > 0
          ? _parseInt(patientData?['weight_kg'])
          : fallbackWeight;
      final finalHeight = _parseInt(patientData?['height_cm']) > 0
          ? _parseInt(patientData?['height_cm'])
          : fallbackHeight;

      return Profile(
        id: uid.hashCode,
        name: (profileData?['name'] ?? patientData?['name'] ?? fallbackName).toString(),
        email: profileData?['email']?.toString() ?? patientData?['email']?.toString() ?? fallbackEmail,
        countryCode: '',
        weight: finalWeight,
        height: finalHeight,
        dob: patientData?['date_of_birth']?.toString() ?? fallbackDob,
        dominantHand: dominantHand,
        palmLength: patientData?['palm_length_mm'],
        palmWidth: patientData?['palm_width_mm'],
        knucklesLength: patientData?['knuckle_length_mm'],
        phone: patientData?['phone']?.toString() ?? fallbackPhone,
        city: patientData?['city']?.toString(),
        country: patientData?['country']?.toString(),
        address: patientData?['address']?.toString(),
        pincode: patientData?['pincode']?.toString(),
        gender: patientData?['gender']?.toString(),
        access_code: patientData?['patient_code']?.toString() ?? fallbackPatientCode,
        device: devicesList,
      );
    } catch (e) {
      _logger.e('getAccountDetails error: $e');
      final fallbackName = box.read<String>('user_name') ?? box.read<String>('userName') ?? 'User';
      return Profile(
        id: 0,
        name: fallbackName,
        email: box.read<String>('user_email'),
        countryCode: '',
        weight: _parseInt(box.read('weight_kg')),
        height: _parseInt(box.read('height_cm')),
        dob: box.read<String>('date_of_birth'),
        access_code: box.read<String>('patient_code'),
        device: [],
      );
    }
  }

  Future<List<Device>> getDevices() async {
    try {
      final userId = patientSupabaseClient.auth.currentUser?.id;
      if (userId == null) return [];

      // Primary source: device_pairings (written by pair-device edge function)
      final pairings = await patientSupabaseClient
          .from('device_pairings')
          .select('device_code, device_name, paired_at, is_active')
          .eq('user_id', userId)
          .eq('is_active', true);

      if ((pairings as List).isNotEmpty) {
        return pairings.map((d) {
          return Device(
            id: (d['device_code'] ?? '').hashCode,
            userId: userId.hashCode,
            deviceName: (d['device_name'] ?? 'VitalStep Device').toString(),
            deviceCode: (d['device_code'] ?? '').toString(),
            createdAt: d['paired_at'] != null
                ? DateTime.tryParse(d['paired_at'])
                : null,
          );
        }).toList();
      }

      // Fallback: legacy devices table
      final data = await patientSupabaseClient
          .from('devices')
          .select()
          .eq('user_id', userId);

      return (data as List).map((d) {
        return Device(
          id: d['id']?.toString().hashCode ?? 0,
          userId: d['user_id']?.toString().hashCode ?? 0,
          deviceName: (d['device_name'] ?? d['deviceName'] ?? 'VitalStep Device').toString(),
          deviceCode: (d['device_code'] ?? d['deviceCode'] ?? '').toString(),
          createdAt: d['created_at'] != null ? DateTime.tryParse(d['created_at']) : null,
        );
      }).toList();
    } catch (e) {
      _logger.e('getDevices error: $e');
      return [];
    }
  }

  Future<void> addDevice({
    required String deviceCode,
    required String deviceName,
  }) async {
    try {
      final token = patientSupabaseClient.auth.currentSession?.accessToken;
      if (token == null) throw Exception('No authentication token');

      // Call the pair-device edge function to:
      // 1. Verify device exists in device_inventory
      // 2. Update device_inventory.paired_user_id
      // 3. Create app-level pairing record
      final response = await patientSupabaseClient.functions.invoke(
        'pair-device',
        body: {
          'device_code': deviceCode,
          'device_name': deviceName,
        },
      );

      if (response.data is! Map) {
        throw Exception('Invalid response from pair-device');
      }

      final Map<String, dynamic> result = response.data as Map<String, dynamic>;

      if (result['ok'] != true || result['paired'] != true) {
        throw Exception(result['error'] ?? 'Failed to pair device');
      }

      _logger.i('Device paired successfully: $deviceCode');
    } catch (e) {
      _logger.e('addDevice error: $e');
      throw Exception('Failed to pair device: $e');
    }
  }

  Future<void> unpairDevice({required String deviceCode}) async {
    try {
      final userId = patientSupabaseClient.auth.currentUser?.id ?? box.read('userId')?.toString();
      if (userId == null) throw Exception('No user logged in');

      // 1. Mark device pairing as inactive in device_pairings
      await patientSupabaseClient
          .from('device_pairings')
          .update({'is_active': false})
          .eq('device_code', deviceCode)
          .eq('user_id', userId);

      // 2. Clear paired_user_id in device_inventory so it becomes free for any user to pair
      await patientSupabaseClient
          .from('device_inventory')
          .update({
            'paired_user_id': null,
            'paired_at': null,
            'status': 'manufactured',
          })
          .eq('device_code', deviceCode);

      // 3. Also update legacy devices table if present
      try {
        await patientSupabaseClient
            .from('devices')
            .update({'is_active': false})
            .eq('device_code', deviceCode)
            .eq('user_id', userId);
      } catch (_) {}

      _logger.i('Device unpaired successfully: $deviceCode');
    } catch (e) {
      _logger.e('unpairDevice error: $e');
      throw Exception('Failed to unpair device: $e');
    }
  }

  Future<bool> killApp() async {
    try {
      final mainResult = await patientSupabaseClient
          .from('kill_switch')
          .select('is_enabled')
          .eq('feature_name', 'app_active')
          .maybeSingle();
      if (mainResult != null) {
        return !(mainResult['is_enabled'] as bool? ?? true);
      }

      final response = await legacySupabaseClient
          .from("vitalStep")
          .select()
          .eq("id", 1)
          .single()
          .timeout(const Duration(seconds: 3));
      return response['kill_switch'] ?? false;
    } catch (e) {
      _logger.w("Kill switch check skipped: $e");
      return false;
    }
  }

  Future<void> deleteAccount() async {
    try {
      final userId = patientSupabaseClient.auth.currentUser?.id;
      if (userId == null) return;

      await patientSupabaseClient.from('profiles').delete().eq('id', userId);
      await patientSupabaseClient.auth.signOut();
      await box.erase();
      Fluttertoast.showToast(msg: "Account deleted successfully");
    } catch (e) {
      _logger.e('deleteAccount error: $e');
      Fluttertoast.showToast(
          msg: "Unable to delete the account, please try again later.");
    }
  }
}
