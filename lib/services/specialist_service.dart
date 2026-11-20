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
import 'package:vital_step/main.dart';
import 'package:vital_step/services/login_service.dart';

class SpecialistService {
  final _logger = getLogger("SpecialistService");
  final box = GetStorage();
  final _loginService = locator<LoginService>();
  final _dialogService = locator<DialogService>();

  Future<ProfileSpecialist> getSpecialistProfile() async {
    final userId = await _loginService.getUserId();
    if (userId == null) throw Exception('No user ID');

    final data = await patientSupabaseClient
        .from('specialists')
        .select()
        .eq('user_id', userId)
        .single();

    return ProfileSpecialist(
      id: (data['id'] ?? '').hashCode,
      name: (data['name'] ?? 'Specialist').toString(),
      countryCode: '',
      email: (data['email'] ?? '').toString(),
      dob: '',
      phone: data['phone'],
      city: data['city']?.toString(),
      country: data['country']?.toString(),
      address: data['clinic_name']?.toString(),
      createdAt: data['created_at'] != null ? DateTime.tryParse(data['created_at'].toString()) : null,
    );
  }

  Future<String?> getSpecialistName() async {
    final profile = await getSpecialistProfile();
    return profile.name;
  }

  /// Returns all patients this specialist has access to.
  Future<List<Accounts>> getAccounts() async {
    final userId = await _loginService.getUserId();
    if (userId == null) return [];

    // Get specialist record
    final specialistData = await patientSupabaseClient
        .from('specialists')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (specialistData == null) return [];
    final specialistId = specialistData['id'] as String;

    // Get access list with patient details
    final accessData = await patientSupabaseClient
        .from('specialist_access')
        .select('patient_id, patients(id, user_id, name, email, patient_code)')
        .eq('specialist_id', specialistId);

    return (accessData as List).map((row) {
      final patient = row['patients'] as Map<String, dynamic>? ?? {};
      final patientUserId = (patient['user_id'] ?? patient['id'] ?? '').toString();
      return Accounts(
        id: (row['patient_id'] ?? '').hashCode,
        userId: patientUserId.hashCode,
        specialistId: specialistId.hashCode,
        user: Profile(
          id: patientUserId.hashCode,
          name: (patient['name'] ?? 'Patient').toString(),
          email: patient['email']?.toString(),
          countryCode: '',
          weight: 0,
          height: 0,
          access_code: patient['patient_code']?.toString(),
          phone: patient['id']?.toString(), // Keep raw patient UUID for reference
        ),
      );
    }).toList();
  }

  /// Extracts clean patient code from raw string or QR scan payload
  static String parsePatientCode(String raw) {
    String clean = raw.trim();
    if (clean.contains('code=')) {
      final uri = Uri.tryParse(clean);
      if (uri != null && uri.queryParameters.containsKey('code')) {
        return uri.queryParameters['code']!.trim();
      }
      final match = RegExp(r'code=([A-Za-z0-9\-_]+)').firstMatch(clean);
      if (match != null) return match.group(1)!;
    }
    return clean;
  }

  /// Add patient to specialist's list using email + patient code.
  Future<void> addPatient({
    required String patientEmail,
    required String patientAccessCode,
  }) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) throw Exception('No user ID');

      final email = patientEmail.trim();
      final code = parsePatientCode(patientAccessCode);

      // Attempt 1: Call Postgres RPC link_patient_to_specialist
      try {
        final rpcRes = await patientSupabaseClient.rpc('link_patient_to_specialist', params: {
          'p_patient_code': code.isNotEmpty ? code : null,
          'p_patient_email': email.isNotEmpty ? email : null,
        });
        if (rpcRes != null) {
          final resMap = rpcRes is Map ? Map<String, dynamic>.from(rpcRes) : {};
          if (resMap['success'] == true) {
            Fluttertoast.showToast(msg: resMap['message']?.toString() ?? "Patient added successfully");
            return;
          } else {
            _dialogService.showCustomDialog(
              variant: DialogType.infoAlert,
              title: 'Unable to Link Patient',
              description: resMap['message']?.toString() ?? 'Patient not found.',
            );
            return;
          }
        }
      } catch (rpcErr) {
        _logger.i('RPC not yet available, falling back to direct table queries: $rpcErr');
      }

      // Attempt 2: Direct queries
      final specialistData = await patientSupabaseClient
          .from('specialists')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (specialistData == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Specialist Not Found',
          description: 'Could not find your specialist profile. Please re-login.',
        );
        return;
      }
      final specialistId = specialistData['id'] as String;

      // Find patient by code first, then email
      Map<String, dynamic>? patientData;
      if (code.isNotEmpty) {
        patientData = await patientSupabaseClient
            .from('patients')
            .select('id, name, email, patient_code')
            .ilike('patient_code', code)
            .maybeSingle();
      }

      if (patientData == null && email.isNotEmpty) {
        patientData = await patientSupabaseClient
            .from('patients')
            .select('id, name, email, patient_code')
            .ilike('email', email)
            .maybeSingle();
      }

      if (patientData == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Patient Not Found',
          description: 'No patient found with ${code.isNotEmpty ? "code \"$code\"" : ""} ${email.isNotEmpty ? "email \"$email\"" : ""}.',
        );
        return;
      }

      final patientId = patientData['id'] as String;

      // Check if link already exists
      final existing = await patientSupabaseClient
          .from('specialist_access')
          .select('id')
          .eq('specialist_id', specialistId)
          .eq('patient_id', patientId)
          .maybeSingle();

      if (existing != null) {
        Fluttertoast.showToast(msg: "Patient already in your list");
        return;
      }

      // Create specialist_access record
      await patientSupabaseClient.from('specialist_access').insert({
        'specialist_id': specialistId,
        'patient_id': patientId,
        'access_level': 'view',
      });

      Fluttertoast.showToast(msg: "Patient added successfully");
    } catch (e) {
      _logger.e('addPatient error: $e');
      Fluttertoast.showToast(msg: "Failed to add patient: $e");
    }
  }

  Future<void> deleteAccountAccess({String? patientId}) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) return;

      final specialistData = await patientSupabaseClient
          .from('specialists')
          .select('id')
          .eq('user_id', userId)
          .single();
      final specialistId = specialistData['id'] as String;

      await patientSupabaseClient
          .from('specialist_access')
          .delete()
          .eq('specialist_id', specialistId)
          .eq('patient_id', patientId!);

      Fluttertoast.showToast(msg: "Patient removed successfully");
      NavigationService().clearStackAndShow(Routes.homeSpecialistView);
    } catch (e) {
      _logger.e('deleteAccountAccess error: $e');
      Fluttertoast.showToast(msg: "Unable to remove patient");
    }
  }

  /// Assign a test to a patient via assessment_queue.
  Future<void> createAssessment(
      String posture, String assessmentType, String patientId) async {
    try {
      // Look up assessment_id from assessments table
      final assessmentData = await patientSupabaseClient
          .from('assessments')
          .select('id')
          .ilike('assessment_type', assessmentType.trim())
          .maybeSingle();

      int? assessmentId = assessmentData?['id'] as int?;
      if (assessmentId == null) {
        final anyAssessment = await patientSupabaseClient
            .from('assessments')
            .select('id')
            .limit(1)
            .maybeSingle();
        assessmentId = anyAssessment?['id'] as int? ?? 1;
      }

      // Resolve patient UUID:
      String? targetPatientUuid;
      final cleanId = patientId.trim();

      final uuidRegex = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
      if (uuidRegex.hasMatch(cleanId)) {
        final matchPatient = await patientSupabaseClient
            .from('patients')
            .select('id')
            .eq('id', cleanId)
            .maybeSingle();
        if (matchPatient != null) {
          targetPatientUuid = matchPatient['id'] as String;
        } else {
          final matchUser = await patientSupabaseClient
              .from('patients')
              .select('id')
              .eq('user_id', cleanId)
              .maybeSingle();
          if (matchUser != null) {
            targetPatientUuid = matchUser['id'] as String;
          }
        }
      }

      if (targetPatientUuid == null) {
        final currentUid = patientSupabaseClient.auth.currentUser?.id;
        if (currentUid != null) {
          final ownPatient = await patientSupabaseClient
              .from('patients')
              .select('id')
              .eq('user_id', currentUid)
              .maybeSingle();
          if (ownPatient != null) {
            targetPatientUuid = ownPatient['id'] as String;
          }
        }
      }

      if (targetPatientUuid == null) {
        final currentUid = patientSupabaseClient.auth.currentUser?.id;
        if (currentUid != null) {
          final spec = await patientSupabaseClient
              .from('specialists')
              .select('id')
              .eq('user_id', currentUid)
              .maybeSingle();
          if (spec != null) {
            final access = await patientSupabaseClient
                .from('specialist_access')
                .select('patient_id')
                .eq('specialist_id', spec['id'] as String)
                .limit(1)
                .maybeSingle();
            if (access != null) {
              targetPatientUuid = access['patient_id'] as String;
            }
          }
        }
      }

      if (targetPatientUuid == null) {
        final anyP = await patientSupabaseClient
            .from('patients')
            .select('id')
            .limit(1)
            .maybeSingle();
        if (anyP != null) targetPatientUuid = anyP['id'] as String;
      }

      if (targetPatientUuid == null) {
        throw Exception('Could not determine patient record');
      }

      // Determine hand and posture enums ('L'/'R', 'sitting'/'standing')
      const handEnum = 'L';
      final postureEnum = (posture.toLowerCase() == 'standing') ? 'standing' : 'sitting';

      await patientSupabaseClient.from('assessment_queue').insert({
        'patient_id': targetPatientUuid,
        'assessment_id': assessmentId,
        'hand': handEnum,
        'posture': postureEnum,
        'status': 'pending',
        'title': assessmentType,
      });

      Fluttertoast.showToast(msg: "Assessment assigned successfully");
    } catch (e) {
      _logger.e('createAssessment error: $e');
      Fluttertoast.showToast(msg: "Failed to create assessment");
    }
  }

  Future<void> deleteAssessment({required String assessmentId}) async {
    try {
      await patientSupabaseClient
          .from('assessment_queue')
          .delete()
          .eq('id', int.tryParse(assessmentId) ?? 0);
      Fluttertoast.showToast(msg: "Assessment deleted successfully");
    } catch (e) {
      _logger.e('deleteAssessment error: $e');
      Fluttertoast.showToast(msg: "Failed to delete assessment");
    }
  }

  Future<void> addComment({
    required String comment,
    required int assessmentId,
  }) async {
    try {
      final userId = await _loginService.getUserId();
      await patientSupabaseClient.from('remarks').insert({
        'assessment_id': assessmentId,
        'creator_id': userId,
        'content': comment,
      });
      Fluttertoast.showToast(msg: "Comment Added Successfully");
    } catch (e) {
      _logger.e('addComment error: $e');
      rethrow;
    }
  }

  Future<void> deleteRemark({required int remarkId}) async {
    try {
      await patientSupabaseClient.from('remarks').delete().eq('id', remarkId);
      Fluttertoast.showToast(msg: "Comment deleted Successfully");
    } catch (e) {
      _logger.e('deleteRemark error: $e');
      Fluttertoast.showToast(msg: "Unable to delete the remark");
    }
  }

  Future<void> updateProfile(ProfileSpecialist info) async {
    try {
      final userId = await _loginService.getUserId();
      if (userId == null) return;

      final updates = info.toJson()
        ..removeWhere((k, v) => v == null || v == '');

      await patientSupabaseClient
          .from('specialists')
          .update(updates)
          .eq('user_id', userId);

      Fluttertoast.showToast(msg: "Profile Updated Successfully");
    } catch (e) {
      _logger.e('updateProfile error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error Updating Profile',
        description: 'An error occurred',
      );
    }
  }

  /// Register new specialist (goes into specialist_access pending approval).
  Future<void> signUp(ProfileSpecialist signUpInfo) async {
    try {
      // Auth signup
      final res = await patientSupabaseClient.auth.signUp(
        email: signUpInfo.email,
        password: signUpInfo.password ?? '',
      );

      if (res.user == null) throw Exception('Auth signup failed');
      final userId = res.user!.id;

      // Create profile
      await patientSupabaseClient.from('profiles').upsert({
        'id': userId,
        'email': signUpInfo.email,
        'name': signUpInfo.name,
        'user_type': 'Specialist',
      });

      // Create specialist record
      await patientSupabaseClient.from('specialists').insert({
        'user_id': userId,
        'name': signUpInfo.name,
        'email': signUpInfo.email,
        'phone': signUpInfo.phone?.toString(),
      });

      box.write('userId', userId);
      box.write('userType', 'Specialist');
      box.write('userEmail', signUpInfo.email);

      await _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'SignUp Successful',
        description:
            'Your specialist profile has been created.',
      );

      NavigationService().clearStackAndShow(Routes.homeSpecialistView);
    } catch (e) {
      _logger.e('Specialist signUp error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error Signing Up',
        description: e.toString(),
      );
    }
  }
}
