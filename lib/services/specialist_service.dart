import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_storage/get_storage.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/Model/accounts.dart';
import 'package:vital_step/Model/profile.dart';
import 'package:vital_step/Model/spcialist_profile.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/app/app.router.dart';
import 'package:vital_step/services/login_service.dart';
import 'package:vital_step/services/supabase_service.dart';

class SpecialistService {
  final _logger = getLogger("SpecialistService");
  final _box = GetStorage();
  final _loginService = locator<LoginService>();
  final _dialogService = locator<DialogService>();

  // ─── SIGNUP ───────────────────────────────────────────────────────────────

  Future<void> signUp(ProfileSpecialist info) async {
    try {
      _logger.i('Specialist signup: ${info.email}');

      // 1. Create Supabase auth user
      final response = await vitalstepSupabaseClient.auth.signUp(
        email: info.email!.trim(),
        password: info.password!.trim(),
      );

      if (response.user == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Sign Up Failed',
          description: 'Could not create account. Please try again.',
        );
        return;
      }

      final userId = response.user!.id;

      // 2. Insert into specialists table
      await vitalstepSupabaseClient.from('specialists').insert({
        'user_id': userId,
        'name': info.name ?? '',
        'email': info.email!.trim(),
        'phone': info.phone?.toString(),
      });

      _box.write('userId', userId);
      _box.write('userType', 'Specialist');

      _logger.i('Specialist signup successful: $userId');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Sign Up Successful',
        description: 'Your specialist account has been created. Please verify your email to log in.',
      );
    } on Exception catch (e) {
      _logger.e('signUp error: $e');
      final msg = e.toString();
      String desc = 'An error occurred during sign up.';
      if (msg.contains('already registered') || msg.contains('already exists')) {
        desc = 'An account with this email already exists.';
      }
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error Signing Up',
        description: desc,
      );
    }
  }

  // ─── PROFILE ──────────────────────────────────────────────────────────────

  Future<ProfileSpecialist> getSpecialistProfile() async {
    final userId = await _loginService.getUserId();
    if (userId == null) throw Exception('Not logged in');

    final data = await vitalstepSupabaseClient
        .from('specialists')
        .select('*')
        .eq('user_id', userId)
        .single();

    return ProfileSpecialist(
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      phone: int.tryParse(data['phone']?.toString() ?? '0') ?? 0,
      countryCode: data['country_code'] ?? '+91',
      dob: data['created_at'] ?? DateTime.now().toIso8601String(),
      city: data['city'],
      country: data['country'],
    );
  }

  Future<void> updateProfile(ProfileSpecialist info) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) throw Exception('Not logged in');

      await vitalstepSupabaseClient.from('specialists').update({
        'name': info.name,
        'phone': info.phone?.toString(),
        'city': info.city,
        'country': info.country,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('user_id', userId);

      Fluttertoast.showToast(msg: 'Profile updated successfully');
    } catch (e) {
      _logger.e('updateProfile error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Update Failed',
        description: 'Could not update profile. Please try again.',
      );
    }
  }

  // ─── PATIENT MANAGEMENT ───────────────────────────────────────────────────

  /// Get all patients linked to this specialist
  Future<List<Accounts>> getAccounts() async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) return [];

      // Get specialist's internal ID first
      final specialistData = await vitalstepSupabaseClient
          .from('specialists')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (specialistData == null) return [];

      final specialistId = specialistData['id'];

      // Get all linked patients via specialist_access
      final accessData = await vitalstepSupabaseClient
          .from('specialist_access')
          .select('patient_id, patients(id, user_id, name, email, patient_code)')
          .eq('specialist_id', specialistId);

      List<Accounts> accounts = [];
      for (final row in (accessData as List)) {
        final patient = row['patients'];
        if (patient != null) {
          accounts.add(Accounts(
            id: 0,
            userId: 0,
            specialistId: 0,
            user: Profile(
              name: patient['name'] ?? '',
              email: patient['email'] ?? '',
              countryCode: '+91',
              weight: 0,
              height: 0,
            ),
          ));
        }
      }
      return accounts;
    } catch (e) {
      _logger.e('getAccounts error: $e');
      return [];
    }
  }

  Future<String?> getSpecialistName() async {
    try {
      final profile = await getSpecialistProfile();
      return profile.name;
    } catch (e) {
      return null;
    }
  }

  /// Add patient using patient_code (shown in patient's profile screen)
  Future<void> addPatient({
    required String patientEmail,
    required String patientAccessCode,
  }) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) throw Exception('Not logged in');

      // Get specialist's internal ID
      final specialistData = await vitalstepSupabaseClient
          .from('specialists')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (specialistData == null) throw Exception('Specialist profile not found');
      final specialistId = specialistData['id'];

      // Find patient by patient_code
      final patientData = await vitalstepSupabaseClient
          .from('patients')
          .select('id, name')
          .eq('patient_code', patientAccessCode.trim())
          .maybeSingle();

      if (patientData == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Patient Not Found',
          description: 'No patient found with that code. Ask the patient to check their profile for the Patient Code.',
        );
        return;
      }

      final patientId = patientData['id'];
      final patientName = patientData['name'];

      // Check if already linked
      final existing = await vitalstepSupabaseClient
          .from('specialist_access')
          .select('id')
          .eq('specialist_id', specialistId)
          .eq('patient_id', patientId)
          .maybeSingle();

      if (existing != null) {
        Fluttertoast.showToast(msg: '$patientName is already linked to your account');
        return;
      }

      // Create the link
      await vitalstepSupabaseClient.from('specialist_access').insert({
        'specialist_id': specialistId,
        'patient_id': patientId,
        'access_level': 'view',
      });

      Fluttertoast.showToast(msg: '$patientName added successfully');
      NavigationService().clearStackAndShow(Routes.homeSpecialistView);
    } catch (e) {
      _logger.e('addPatient error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error',
        description: 'Could not add patient: ${e.toString()}',
      );
    }
  }

  Future<void> deleteAccountAccess({dynamic id}) async {
    try {
      await vitalstepSupabaseClient
          .from('specialist_access')
          .delete()
          .eq('id', id);

      Fluttertoast.showToast(msg: 'Patient removed successfully');
      NavigationService().clearStackAndShow(Routes.homeSpecialistView);
    } catch (e) {
      _logger.e('deleteAccountAccess error: $e');
      Fluttertoast.showToast(msg: 'Unable to remove patient');
    }
  }

  // ─── ASSESSMENTS ──────────────────────────────────────────────────────────

  /// Create an assessment for a patient (appears on their screen)
  Future<void> createAssessment(
    String posture,
    String assessmentType,
    String patientId,
  ) async {
    try {
      // Find the assessment type ID
      final assessmentData = await vitalstepSupabaseClient
          .from('assessments')
          .select('id')
          .eq('assessment_type', assessmentType)
          .maybeSingle();

      int assessmentId;
      if (assessmentData == null) {
        // Create the assessment type if it doesn't exist
        final inserted = await vitalstepSupabaseClient
            .from('assessments')
            .insert({'assessment_type': assessmentType, 'description': assessmentType})
            .select('id')
            .single();
        assessmentId = inserted['id'];
      } else {
        assessmentId = assessmentData['id'];
      }

      // Insert into assessment_queue for the patient
      await vitalstepSupabaseClient.from('assessment_queue').insert({
        'patient_id': patientId,
        'assessment_id': assessmentId,
        'hand': 'Right',
        'posture': posture,
        'status': 'pending',
        'title': assessmentType,
      });

      Fluttertoast.showToast(msg: 'Assessment created successfully');
    } catch (e) {
      _logger.e('createAssessment error: $e');
      throw Exception('Failed to create assessment: $e');
    }
  }

  Future<void> deleteAssessment({required dynamic assessmentId}) async {
    try {
      await vitalstepSupabaseClient
          .from('assessment_queue')
          .delete()
          .eq('id', assessmentId);

      Fluttertoast.showToast(msg: 'Assessment deleted successfully');
    } catch (e) {
      _logger.e('deleteAssessment error: $e');
      Fluttertoast.showToast(msg: 'Failed to delete assessment');
    }
  }

  // ─── COMMENTS / REMARKS ───────────────────────────────────────────────────

  Future<void> addComment({
    required String comment,
    required dynamic assessmentId,
  }) async {
    try {
      final userId = await _loginService.getUserId();

      // Get specialist internal ID
      final specialistData = await vitalstepSupabaseClient
          .from('specialists')
          .select('id')
          .eq('user_id', userId!)
          .maybeSingle();

      await vitalstepSupabaseClient.from('remarks').insert({
        'assigner_id': specialistData?['id'],
        'assessment_id': assessmentId,
        'remarks': comment,
      });

      Fluttertoast.showToast(msg: 'Comment added successfully');
    } catch (e) {
      _logger.e('addComment error: $e');
      throw e;
    }
  }

  Future<void> deleteRemark({required dynamic remarkId}) async {
    try {
      await vitalstepSupabaseClient
          .from('remarks')
          .delete()
          .eq('id', remarkId);

      Fluttertoast.showToast(msg: 'Comment deleted successfully');
    } catch (e) {
      _logger.e('deleteRemark error: $e');
      Fluttertoast.showToast(msg: 'Unable to delete comment');
    }
  }

  // ─── PATIENT DATA FOR SPECIALIST ──────────────────────────────────────────

  /// Get measurements for a specific patient (for specialist graphs)
  Future<List<Map<String, dynamic>>> getPatientMeasurements(String patientId) async {
    try {
      // Get the patient's device IDs first
      final deviceData = await vitalstepSupabaseClient
          .from('devices')
          .select('id')
          .eq('user_id', patientId);

      if ((deviceData as List).isEmpty) return [];

      final deviceIds = deviceData.map((d) => d['id']).toList();

      final measurements = await vitalstepSupabaseClient
          .from('measurements')
          .select('*')
          .inFilter('device_id', deviceIds)
          .order('recorded_at', ascending: false)
          .limit(100);

      return (measurements as List).cast<Map<String, dynamic>>();
    } catch (e) {
      _logger.e('getPatientMeasurements error: $e');
      return [];
    }
  }
}
