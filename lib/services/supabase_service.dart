import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:get_storage/get_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vital_step/Model/Assessment.dart';
import 'package:vital_step/Model/Comment.dart';
import 'package:vital_step/Model/Device.dart';
import 'package:vital_step/Model/profile.dart';
import 'package:vital_step/Model/test.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';

/// Global reference to the main Supabase client for the VitalStep project
/// This replaces Digital Ocean REST API calls
late final SupabaseClient vitalstepSupabaseClient;

/// Service to replace all Digital Ocean API calls with Supabase client calls
/// 
/// Maps Digital Ocean endpoints to Supabase database operations:
/// - POST /test → INSERT into test_results
/// - GET /test/user/{id} → SELECT * FROM test_results WHERE user_id = id
/// - POST /assessment → INSERT into assessments
/// - GET /queue/user/{id} → SELECT * FROM assessment_queue WHERE user_id = id
/// - POST /device → INSERT into devices
/// - etc.
class SupabaseService {
  final _logger = getLogger('SupabaseService');
  final _box = GetStorage();

  /// Initialize the Supabase client (called from main.dart)
  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    vitalstepSupabaseClient = SupabaseClient(url, anonKey);
    _logger.i('SupabaseService initialized with URL: $url');
  }

  // ─── AUTHENTICATION ENDPOINTS ───────────────────────────────────────────

  /// Sign up a new patient
  /// Replaces: POST /auth/register
  Future<Map<String, dynamic>> signUpPatient({
    required String name,
    required String email,
    required String password,
    required int phone,
    required String countryCode,
    required String dob,
    required String gender,
    required int weight,
    required int height,
    required String dominantHand,
    String? city,
    String? country,
    String? address,
    int? pincode,
    double? palmLength,
    double? palmWidth,
    double? knuckleLength,
  }) async {
    try {
      // 1. Create auth user
      final AuthResponse res = await vitalstepSupabaseClient.auth
          .signUpWithPassword(
            email: email,
            password: password,
          );

      if (res.user == null) {
        throw Exception('Failed to create auth user');
      }

      // 2. Create profile record
      final userId = res.user!.id;
      await vitalstepSupabaseClient
          .from('profiles')
          .insert({
            'id': userId,
            'email': email,
            'name': name,
            'phone': phone,
            'country_code': countryCode,
            'dob': dob,
            'gender': gender,
            'weight': weight,
            'height': height,
            'dominant_hand': dominantHand,
            'city': city,
            'country': country,
            'address': address,
            'pincode': pincode,
            'palm_length': palmLength,
            'palm_width': palmWidth,
            'knuckles_length': knuckleLength,
            'user_type': 'Patient',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          });

      _logger.i('Patient signed up: $email');

      return {
        'id': userId,
        'email': email,
        'name': name,
      };
    } catch (e) {
      _logger.e('SignUp error: $e');
      rethrow;
    }
  }

  /// Sign in a patient
  /// Replaces: POST /auth/login
  Future<Map<String, dynamic>> signInPatient({
    required String email,
    required String password,
  }) async {
    try {
      final AuthResponse res = await vitalstepSupabaseClient.auth
          .signInWithPassword(
            email: email,
            password: password,
          );

      if (res.user == null) {
        throw Exception('Sign in failed');
      }

      final userId = res.user!.id;

      // Fetch profile
      final profileData = await vitalstepSupabaseClient
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();

      // Store user info
      _box.write('userId', userId);
      _box.write('userType', 'Patient');
      _box.write('userEmail', email);

      _logger.i('Patient signed in: $email');

      return {
        'id': userId,
        'email': email,
        ...profileData,
      };
    } catch (e) {
      _logger.e('SignIn error: $e');
      rethrow;
    }
  }

  /// Sign up a specialist (goes to approval queue)
  /// Replaces: POST /specialist-queue
  Future<Map<String, dynamic>> signUpSpecialist({
    required String name,
    required String email,
    required String password,
    required int phone,
    required String countryCode,
    String? city,
    String? country,
    String? address,
    int? pincode,
  }) async {
    try {
      // 1. Create auth user
      final AuthResponse res = await vitalstepSupabaseClient.auth
          .signUpWithPassword(
            email: email,
            password: password,
          );

      if (res.user == null) {
        throw Exception('Failed to create specialist auth');
      }

      // 2. Create profile with pending status
      final userId = res.user!.id;
      await vitalstepSupabaseClient
          .from('profiles')
          .insert({
            'id': userId,
            'email': email,
            'name': name,
            'phone': phone,
            'country_code': countryCode,
            'city': city,
            'country': country,
            'address': address,
            'pincode': pincode,
            'user_type': 'Specialist',
            'is_pending_approval': true, // Custom field if needed
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          });

      _logger.i('Specialist signed up (pending approval): $email');

      return {
        'id': userId,
        'email': email,
        'name': name,
        'status': 'Pending Approval',
      };
    } catch (e) {
      _logger.e('SignUp specialist error: $e');
      rethrow;
    }
  }

  /// Sign in a specialist
  /// Replaces: POST /auth/login-specialist
  Future<Map<String, dynamic>> signInSpecialist({
    required String email,
    required String password,
  }) async {
    try {
      final AuthResponse res = await vitalstepSupabaseClient.auth
          .signInWithPassword(
            email: email,
            password: password,
          );

      if (res.user == null) {
        throw Exception('Specialist sign in failed');
      }

      final userId = res.user!.id;

      // Fetch profile
      final profileData = await vitalstepSupabaseClient
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();

      // Check if pending approval
      if (profileData['user_type'] != 'Specialist') {
        throw Exception('Account is not a specialist');
      }

      // Store user info
      _box.write('userId', userId);
      _box.write('userType', 'Specialist');
      _box.write('userEmail', email);

      _logger.i('Specialist signed in: $email');

      return {
        'id': userId,
        'email': email,
        ...profileData,
      };
    } catch (e) {
      _logger.e('SignIn specialist error: $e');
      rethrow;
    }
  }

  // ─── USER PROFILE ENDPOINTS ────────────────────────────────────────────

  /// Get complete user profile with related data
  /// Replaces: GET /user/{userId}
  Future<Profile> getAccountDetails({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID available');

      // 1. Fetch profile
      final profileData = await vitalstepSupabaseClient
          .from('profiles')
          .select()
          .eq('id', uid)
          .single();

      // 2. Fetch devices
      final devicesData = await vitalstepSupabaseClient
          .from('devices')
          .select()
          .eq('user_id', uid);

      // 3. Fetch assessments
      final assessmentsData = await vitalstepSupabaseClient
          .from('assessments')
          .select()
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      // Convert to Dart models
      final devices = (devicesData as List)
          .map((d) => Device.fromJson(d))
          .toList();

      final assessments = (assessmentsData as List)
          .map((a) => Assessment.fromJson(a))
          .toList();

      return Profile(
        id: profileData['id'],
        name: profileData['name'],
        email: profileData['email'],
        phone: profileData['phone'],
        countryCode: profileData['country_code'],
        dob: profileData['dob'],
        gender: profileData['gender'],
        weight: profileData['weight'],
        height: profileData['height'],
        palmLength: profileData['palm_length'],
        palmWidth: profileData['palm_width'],
        knucklesLength: profileData['knuckles_length'],
        dominantHand: profileData['dominant_hand'],
        accessCode: profileData['access_code'],
        device: devices,
        assessment: assessments,
        city: profileData['city'],
        country: profileData['country'],
        address: profileData['address'],
        pincode: profileData['pincode'],
      );
    } catch (e) {
      _logger.e('getAccountDetails error: $e');
      rethrow;
    }
  }

  /// Update user profile
  /// Replaces: PUT /user/{userId}
  Future<void> updateProfile({
    required Map<String, dynamic> updates,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      updates['updated_at'] = DateTime.now().toIso8601String();

      await vitalstepSupabaseClient
          .from('profiles')
          .update(updates)
          .eq('id', userId);

      _logger.i('Profile updated');
    } catch (e) {
      _logger.e('updateProfile error: $e');
      rethrow;
    }
  }

  /// Delete user account
  /// Replaces: DELETE /user/{userId}
  Future<void> deleteAccount() async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      // Delete cascade will clean up related records
      await vitalstepSupabaseClient
          .from('profiles')
          .delete()
          .eq('id', userId);

      // Sign out
      await vitalstepSupabaseClient.auth.signOut();

      _box.erase();
      _logger.i('Account deleted');
    } catch (e) {
      _logger.e('deleteAccount error: $e');
      rethrow;
    }
  }

  // ─── ASSESSMENT ENDPOINTS ─────────────────────────────────────────────

  /// Create a new assessment
  /// Replaces: POST /assessment
  Future<Map<String, dynamic>> createAssessment({
    required String patientId,
    required String assessmentType,
    required String posture,
  }) async {
    try {
      final response = await vitalstepSupabaseClient
          .from('assessments')
          .insert({
            'user_id': patientId,
            'assessment_type': assessmentType,
            'posture': posture,
            'status': 'Active',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Assessment created: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('createAssessment error: $e');
      rethrow;
    }
  }

  /// Delete assessment
  /// Replaces: DELETE /assessment/{assessmentId}
  Future<void> deleteAssessment({required String assessmentId}) async {
    try {
      await vitalstepSupabaseClient
          .from('assessments')
          .delete()
          .eq('id', assessmentId);

      _logger.i('Assessment deleted: $assessmentId');
    } catch (e) {
      _logger.e('deleteAssessment error: $e');
      rethrow;
    }
  }

  /// Get all assessments for user (via profile)
  /// Replaces: GET /user/{userId} (includes assessments)
  Future<List<Assessment>> getAllUserAssessments({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID');

      final data = await vitalstepSupabaseClient
          .from('assessments')
          .select()
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      return (data as List)
          .map((a) => Assessment.fromJson(a))
          .toList();
    } catch (e) {
      _logger.e('getAllUserAssessments error: $e');
      return [];
    }
  }

  // ─── TEST RESULTS ENDPOINTS ────────────────────────────────────────────

  /// Save a new test result
  /// Replaces: POST /test
  Future<Map<String, dynamic>> saveTest({
    required String assessmentId,
    required double trial1,
    required double trial2,
    required double trial3,
    required String hand,
    required String posture,
    String? deviceId,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      final response = await vitalstepSupabaseClient
          .from('test_results')
          .insert({
            'user_id': userId,
            'assessment_id': assessmentId,
            'device_id': deviceId,
            'trial1': trial1,
            'trial2': trial2,
            'trial3': trial3,
            'hand': hand,
            'posture': posture,
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Test saved: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('saveTest error: $e');
      rethrow;
    }
  }

  /// Get all tests for user
  /// Replaces: GET /test/user/{userId}
  Future<List<Test>> getAllUserTests({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID');

      final data = await vitalstepSupabaseClient
          .from('test_results')
          .select()
          .eq('user_id', uid)
          .order('created_at', ascending: true);

      // Note: Converting to Test model which expects specific fields
      // May need to adjust field names in Test model
      return (data as List).map((t) {
        return Test(
          id: t['id'].toString().hashCode, // Convert UUID to int
          userId: t['user_id'].toString().hashCode,
          deviceId: t['device_id'] != null
              ? t['device_id'].toString().hashCode
              : 0,
          assestmentId: t['assessment_id'].toString().hashCode,
          posture: t['posture'],
          trial1: t['trial1'].toString(),
          trial2: t['trial2'].toString(),
          trial3: t['trial3'].toString(),
          hand: t['hand'],
          createdAt: DateTime.parse(t['created_at']),
        );
      }).toList();
    } catch (e) {
      _logger.e('getAllUserTests error: $e');
      return [];
    }
  }

  /// Get tests for specific assessment
  /// Replaces: GET /test/assessment/{assessmentId}
  Future<List<Test>> getAllAssessmentTests({required String assessmentId}) async {
    try {
      final data = await vitalstepSupabaseClient
          .from('test_results')
          .select()
          .eq('assessment_id', assessmentId)
          .order('created_at', ascending: true);

      return (data as List).map((t) {
        return Test(
          id: t['id'].toString().hashCode,
          userId: t['user_id'].toString().hashCode,
          deviceId: t['device_id'] != null
              ? t['device_id'].toString().hashCode
              : 0,
          assestmentId: t['assessment_id'].toString().hashCode,
          posture: t['posture'],
          trial1: t['trial1'].toString(),
          trial2: t['trial2'].toString(),
          trial3: t['trial3'].toString(),
          hand: t['hand'],
          createdAt: DateTime.parse(t['created_at']),
        );
      }).toList();
    } catch (e) {
      _logger.e('getAllAssessmentTests error: $e');
      return [];
    }
  }

  /// Get latest test per hand
  /// Replaces: GET /test/hands/{userId}
  Future<Map<String, Test?>> getHandsValues({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID');

      final leftTests = await vitalstepSupabaseClient
          .from('test_results')
          .select()
          .eq('user_id', uid)
          .eq('hand', 'Left')
          .order('created_at', ascending: false)
          .limit(1);

      final rightTests = await vitalstepSupabaseClient
          .from('test_results')
          .select()
          .eq('user_id', uid)
          .eq('hand', 'Right')
          .order('created_at', ascending: false)
          .limit(1);

      Map<String, Test?> result = {
        'Left': null,
        'Right': null,
      };

      if ((leftTests as List).isNotEmpty) {
        final t = leftTests[0];
        result['Left'] = Test(
          id: t['id'].toString().hashCode,
          userId: t['user_id'].toString().hashCode,
          deviceId: t['device_id'] != null
              ? t['device_id'].toString().hashCode
              : 0,
          assestmentId: t['assessment_id'].toString().hashCode,
          posture: t['posture'],
          trial1: t['trial1'].toString(),
          trial2: t['trial2'].toString(),
          trial3: t['trial3'].toString(),
          hand: t['hand'],
          createdAt: DateTime.parse(t['created_at']),
        );
      }

      if ((rightTests as List).isNotEmpty) {
        final t = rightTests[0];
        result['Right'] = Test(
          id: t['id'].toString().hashCode,
          userId: t['user_id'].toString().hashCode,
          deviceId: t['device_id'] != null
              ? t['device_id'].toString().hashCode
              : 0,
          assestmentId: t['assessment_id'].toString().hashCode,
          posture: t['posture'],
          trial1: t['trial1'].toString(),
          trial2: t['trial2'].toString(),
          trial3: t['trial3'].toString(),
          hand: t['hand'],
          createdAt: DateTime.parse(t['created_at']),
        );
      }

      return result;
    } catch (e) {
      _logger.e('getHandsValues error: $e');
      return {'Left': null, 'Right': null};
    }
  }

  /// Delete a test
  /// Replaces: DELETE /test/{testId}
  Future<void> deleteTest({required String testId}) async {
    try {
      await vitalstepSupabaseClient
          .from('test_results')
          .delete()
          .eq('id', testId);

      _logger.i('Test deleted: $testId');
    } catch (e) {
      _logger.e('deleteTest error: $e');
      rethrow;
    }
  }

  // ─── QUEUE ENDPOINTS ───────────────────────────────────────────────────

  /// Create queue entry for test
  /// Replaces: POST /queue/
  Future<Map<String, dynamic>> createTestQueue({
    required String assessmentId,
    required String hand,
    required String deviceId,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      final response = await vitalstepSupabaseClient
          .from('assessment_queue')
          .insert({
            'user_id': userId,
            'assessment_id': assessmentId,
            'device_id': deviceId,
            'hand': hand,
            'posture': '', // Will be fetched from assessment
            'status': 'Pending',
            'created_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Queue entry created: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('createTestQueue error: $e');
      rethrow;
    }
  }

  /// Get pending queue for user
  /// Replaces: GET /queue/user/{userId}
  Future<List<Map<String, int>>> getUserQueue({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID');

      final data = await vitalstepSupabaseClient
          .from('assessment_queue')
          .select('id, assessment_id')
          .eq('user_id', uid)
          .eq('status', 'Pending');

      return (data as List)
          .map((q) => {
                'queueId': q['id'].toString().hashCode,
                'assessmentId': q['assessment_id'].toString().hashCode,
              })
          .toList();
    } catch (e) {
      _logger.e('getUserQueue error: $e');
      return [];
    }
  }

  /// Cancel assessment (delete queue entry)
  /// Replaces: DELETE /queue/{queueId}
  Future<void> cancelAssessment({required String queueId}) async {
    try {
      await vitalstepSupabaseClient
          .from('assessment_queue')
          .delete()
          .eq('id', queueId);

      _logger.i('Assessment cancelled: $queueId');
    } catch (e) {
      _logger.e('cancelAssessment error: $e');
      rethrow;
    }
  }

  // ─── DEVICE ENDPOINTS ─────────────────────────────────────────────────

  /// Register new device
  /// Replaces: POST /device
  Future<Map<String, dynamic>> addDevice({
    required String deviceCode,
    required String deviceName,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      final response = await vitalstepSupabaseClient
          .from('devices')
          .insert({
            'user_id': userId,
            'device_code': deviceCode,
            'device_name': deviceName,
            'is_active': true,
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Device added: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('addDevice error: $e');
      rethrow;
    }
  }

  /// Get user's devices
  /// Replaces: (via Profile) GET /user/{userId}
  Future<List<Device>> getDevices({String? userId}) async {
    try {
      final uid = userId ?? vitalstepSupabaseClient.auth.currentUser?.id;
      if (uid == null) throw Exception('No user ID');

      final data = await vitalstepSupabaseClient
          .from('devices')
          .select()
          .eq('user_id', uid)
          .eq('is_active', true);

      return (data as List).map((d) => Device.fromJson(d)).toList();
    } catch (e) {
      _logger.e('getDevices error: $e');
      return [];
    }
  }

  // ─── REMARKS/COMMENTS ENDPOINTS ────────────────────────────────────────

  /// Get comments for assessment
  /// Replaces: GET /remarks/assessment/{assessmentId}
  Future<List<Comment>> getComments({required String assessmentId}) async {
    try {
      final data = await vitalstepSupabaseClient
          .from('remarks')
          .select()
          .eq('assessment_id', assessmentId)
          .order('created_at', ascending: false);

      return (data as List).map((c) => Comment.fromJson(c)).toList();
    } catch (e) {
      _logger.e('getComments error: $e');
      return [];
    }
  }

  /// Add comment to assessment
  /// Replaces: POST /remarks
  Future<void> addComment({
    required String assessmentId,
    required String content,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      await vitalstepSupabaseClient
          .from('remarks')
          .insert({
            'assessment_id': assessmentId,
            'creator_id': userId,
            'content': content,
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          });

      _logger.i('Comment added to assessment: $assessmentId');
    } catch (e) {
      _logger.e('addComment error: $e');
      rethrow;
    }
  }

  /// Delete remark
  /// Replaces: DELETE /remarks/{remarkId}
  Future<void> deleteRemark({required String remarkId}) async {
    try {
      await vitalstepSupabaseClient
          .from('remarks')
          .delete()
          .eq('id', remarkId);

      _logger.i('Remark deleted: $remarkId');
    } catch (e) {
      _logger.e('deleteRemark error: $e');
      rethrow;
    }
  }

  // ─── RESEARCH PATIENT MODE ENDPOINTS ───────────────────────────────────

  /// Create research patient
  Future<Map<String, dynamic>> createResearchPatient({
    required String name,
    required int age,
    required String gender,
    String? contact,
    String? notes,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      // Get next patient code
      final nextCode = await _getNextPatientCode(userId);

      final response = await vitalstepSupabaseClient
          .from('research_patients')
          .insert({
            'host_user_id': userId,
            'patient_code': nextCode,
            'name': name,
            'age': age,
            'gender': gender,
            'contact': contact,
            'notes': notes,
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Research patient created: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('createResearchPatient error: $e');
      rethrow;
    }
  }

  /// Get next patient code (PT-NNNN format)
  Future<String> _getNextPatientCode(String hostUserId) async {
    try {
      final result = await vitalstepSupabaseClient.rpc(
        'get_next_patient_code',
        params: {'p_host_user_id': hostUserId},
      );
      return result as String;
    } catch (e) {
      _logger.w('Could not fetch next code via RPC, generating locally: $e');
      // Fallback: generate locally
      return 'PT-0001';
    }
  }

  /// Save patient reading (dual-write)
  Future<Map<String, dynamic>> savePatientReading({
    required String patientId,
    required double trial1,
    required double trial2,
    required double trial3,
    required String hand,
    required String posture,
    required String assessmentType,
  }) async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId == null) throw Exception('No user ID');

      final response = await vitalstepSupabaseClient
          .from('patient_readings')
          .insert({
            'patient_id': patientId,
            'host_user_id': userId,
            'trial1': trial1,
            'trial2': trial2,
            'trial3': trial3,
            'hand': hand,
            'posture': posture,
            'assessment_type': assessmentType,
            'created_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      _logger.i('Patient reading saved: ${response['id']}');
      return response;
    } catch (e) {
      _logger.e('savePatientReading error: $e');
      rethrow;
    }
  }

  // ─── KILL SWITCH ──────────────────────────────────────────────────────

  /// Check if app should be disabled
  Future<bool> checkKillSwitch() async {
    try {
      final result = await vitalstepSupabaseClient
          .from('kill_switch')
          .select('enabled')
          .eq('id', 1)
          .single();

      final isKilled = result['enabled'] as bool;
      _logger.i('Kill switch status: $isKilled');
      return isKilled;
    } catch (e) {
      _logger.w('Kill switch check failed: $e');
      return false; // Default to enabled if check fails
    }
  }

  // ─── UTILITY METHODS ──────────────────────────────────────────────────

  /// Get current user ID
  String? getCurrentUserId() {
    return vitalstepSupabaseClient.auth.currentUser?.id;
  }

  /// Get current user email
  String? getCurrentUserEmail() {
    return vitalstepSupabaseClient.auth.currentUser?.email;
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await vitalstepSupabaseClient.auth.signOut();
      _box.erase();
      _logger.i('User signed out');
    } catch (e) {
      _logger.e('SignOut error: $e');
      rethrow;
    }
  }
}
