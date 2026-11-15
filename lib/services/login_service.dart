import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_storage/get_storage.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/app/app.router.dart';
import 'package:vital_step/services/notifications_service.dart';
import 'package:vital_step/services/supabase_service.dart';
import 'package:vital_step/Model/SignUpInfo.dart';

class LoginService {
  final _logger = getLogger("LoginService");
  final _box = GetStorage();
  final DialogService _dialogService = locator<DialogService>();

  // ─── AUTH STATE ────────────────────────────────────────────────────────────

  Future<bool> isLoggedIn() async {
    try {
      final session = vitalstepSupabaseClient.auth.currentSession;
      return session != null;
    } catch (e) {
      _logger.e('isLoggedIn error: $e');
      return false;
    }
  }

  Future<String?> getUserId() async {
    try {
      final userId = vitalstepSupabaseClient.auth.currentUser?.id;
      if (userId != null) return userId;
      // Fallback to storage
      return _box.read('userId')?.toString();
    } catch (e) {
      _logger.e('getUserId error: $e');
      return null;
    }
  }

  Future<String?> getUserType() async {
    return _box.read('userType')?.toString() ?? 'Patient';
  }

  // ─── SIGN IN ───────────────────────────────────────────────────────────────

  Future<void> signIn(String email, String password, String selectedUserType) async {
    try {
      _logger.i('Signing in: $email as $selectedUserType');

      final response = await vitalstepSupabaseClient.auth.signInWithPassword(
        email: email.trim(),
        password: password.trim(),
      );

      if (response.session == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Login Failed',
          description: 'No session returned. Please try again.',
        );
        return;
      }

      final userId = response.user!.id;

      // Verify user exists in the correct table
      if (selectedUserType == 'Specialist') {
        final specialist = await vitalstepSupabaseClient
            .from('specialists')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (specialist == null) {
          await vitalstepSupabaseClient.auth.signOut();
          _dialogService.showCustomDialog(
            variant: DialogType.infoAlert,
            title: 'Login Failed',
            description: 'No specialist account found for this email. Please sign up as a specialist first.',
          );
          return;
        }
      } else {
        // Patient — also check/create patients row gracefully
        final patient = await vitalstepSupabaseClient
            .from('patients')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (patient == null) {
          // Auto-create minimal patient row so app doesn't crash
          final patientCode = 'VS${userId.substring(0, 6).toUpperCase()}';
          await vitalstepSupabaseClient.from('patients').upsert({
            'user_id': userId,
            'name': email.split('@')[0],
            'email': email.trim(),
            'patient_code': patientCode,
          });
        }
      }

      _box.write('userId', userId);
      _box.write('userType', selectedUserType);
      _logger.i('Sign in successful: $userId as $selectedUserType');

      NavigationService().navigateToStartupView();
    } on Exception catch (e) {
      _logger.e('signIn error: $e');
      final msg = e.toString();
      String description = 'An error occurred during sign in.';
      if (msg.contains('Invalid login credentials')) {
        description = 'Incorrect email or password.';
      } else if (msg.contains('Email not confirmed')) {
        description = 'Please confirm your email before signing in.';
      } else if (msg.contains('network')) {
        description = 'Network error. Check your internet connection.';
      }
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Login Failed',
        description: description,
      );
    }
  }

  // ─── SIGN UP ───────────────────────────────────────────────────────────────

  Future<void> signUp(SignUpInfo signUpInfo) async {
    try {
      _logger.i('Signing up: ${signUpInfo.email}');

      // 1. Create Supabase auth user
      final response = await vitalstepSupabaseClient.auth.signUp(
        email: signUpInfo.email!.trim(),
        password: signUpInfo.password!.trim(),
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

      // 2. Insert into patients table
      final patientCode = 'VS${userId.substring(0, 6).toUpperCase()}';
      await vitalstepSupabaseClient.from('patients').insert({
        'user_id': userId,
        'name': (signUpInfo.name ?? '').trim(),
        'email': signUpInfo.email!.trim(),
        'phone': signUpInfo.phone?.toString(),
        'patient_code': patientCode,
        'gender': signUpInfo.gender,
        'date_of_birth': signUpInfo.dob,
        'dominant_hand': signUpInfo.dominantHand,
        'weight_kg': signUpInfo.weight,
        'height_cm': signUpInfo.height,
        'palm_length_mm': signUpInfo.palmLength != null ? (signUpInfo.palmLength! * 10).round() : null,
        'palm_width_mm': signUpInfo.palmWidth != null ? (signUpInfo.palmWidth! * 10).round() : null,
        'knuckle_length_mm': signUpInfo.knuckleLength != null ? (signUpInfo.knuckleLength! * 10).round() : null,
        'city': signUpInfo.city,
        'country': signUpInfo.country,
        'address': signUpInfo.address,
        'pincode': signUpInfo.pincode?.toString(),
      });

      _box.write('userId', userId);
      _box.write('userType', 'Patient');

      _logger.i('Sign up successful: $userId');
      Fluttertoast.showToast(msg: "Account created! Please check your email to verify.");
      NavigationService().navigateToDeviceView(showExistingDevices: false);
    } on Exception catch (e) {
      _logger.e('signUp error: $e');
      final msg = e.toString();
      String description = 'An error occurred during sign up.';
      if (msg.contains('already registered') || msg.contains('already exists')) {
        description = 'An account with this email already exists.';
      } else if (msg.contains('Password')) {
        description = 'Password must be at least 6 characters.';
      }
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Sign Up Failed',
        description: description,
      );
    }
  }

  // ─── SIGN OUT ──────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    try {
      await vitalstepSupabaseClient.auth.signOut();
    } catch (e) {
      _logger.w('signOut error (non-critical): $e');
    }
    await _box.erase();
    final notificationsService = locator<NotificationsService>();
    await notificationsService.clearAllFutureNotifications();
    Fluttertoast.showToast(msg: "Signed out successfully");
    NavigationService().navigateToStartupView();
  }

  // ─── UPDATE PROFILE ────────────────────────────────────────────────────────

  Future<void> updateProfile(SignUpInfo signUpInfo) async {
    try {
      final userId = await getUserId();
      if (userId == null) throw Exception('Not logged in');

      await vitalstepSupabaseClient.from('patients').update({
        'name': signUpInfo.name,
        'phone': signUpInfo.phone?.toString(),
        'gender': signUpInfo.gender,
        'date_of_birth': signUpInfo.dob,
        'dominant_hand': signUpInfo.dominantHand,
        'weight_kg': signUpInfo.weight,
        'height_cm': signUpInfo.height,
        'city': signUpInfo.city,
        'country': signUpInfo.country,
        'address': signUpInfo.address,
      }).eq('user_id', userId);

      Fluttertoast.showToast(msg: "Profile updated successfully");
    } catch (e) {
      _logger.e('updateProfile error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      );
    }
  }
}
