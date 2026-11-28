import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_storage/get_storage.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/Model/SignUpInfo.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/app/app.router.dart';
import 'package:vital_step/main.dart';
import 'package:vital_step/services/notifications_service.dart';

class LoginService {
  final _logger = getLogger("LoginService");
  final box = GetStorage();
  final DialogService _dialogService = locator<DialogService>();

  Future<bool> isLoggedIn() async {
    // 1. Always try to refresh the session first — even if currentUser is
    //    non-null, the access token may be expired (Supabase SDK auto-restores
    //    sessions from SharedPreferences on init, but the JWT could have expired
    //    since then). Without a valid token, RLS blocks every query.
    try {
      final res = await patientSupabaseClient.auth.refreshSession();
      if (res.user != null) {
        box.write('userId', res.user!.id);
        return true;
      }
    } catch (_) {}

    // 2. If refresh failed, check whether the current token is still valid
    //    (not yet expired). This handles the case where the network is briefly
    //    unavailable but the token is still usable.
    final session = patientSupabaseClient.auth.currentSession;
    if (session != null && patientSupabaseClient.auth.currentUser != null) {
      final expiresAt = session.expiresAt;
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      if (expiresAt != null && expiresAt > now + 60) {
        box.write('userId', patientSupabaseClient.auth.currentUser!.id);
        return true;
      }
    }

    // 3. Attempt silent auto-login using saved credentials
    final savedEmail = box.read<String>('saved_email') ?? box.read<String>('userEmail');
    final savedPassword = box.read<String>('saved_password');
    if (savedEmail != null && savedPassword != null && savedEmail.isNotEmpty && savedPassword.isNotEmpty) {
      try {
        final res = await patientSupabaseClient.auth.signInWithPassword(
          email: savedEmail.trim().toLowerCase(),
          password: savedPassword.trim(),
        );
        if (res.user != null) {
          box.write('userId', res.user!.id);
          // Cache profile data immediately after successful login
          _cacheProfileAfterLogin(res.user!.id);
          return true;
        }
      } catch (_) {}
    }

    // 4. If no live Supabase session could be established, require fresh login
    // so the app never enters an unauthenticated zombie state where RLS blocks queries
    return false;
  }

  /// Refreshes the Supabase session if the access token is expired or about to expire.
  /// Call this before making any RLS-protected queries.
  Future<bool> ensureValidSession() async {
    final session = patientSupabaseClient.auth.currentSession;
    if (session == null) return false;

    final expiresAt = session.expiresAt;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    // Token still valid for more than 60 seconds
    if (expiresAt != null && expiresAt > now + 60) return true;

    // Token expired or about to expire — refresh
    try {
      final res = await patientSupabaseClient.auth.refreshSession();
      return res.user != null;
    } catch (_) {}

    // Try re-auth with saved credentials
    final savedEmail = box.read<String>('saved_email') ?? box.read<String>('userEmail');
    final savedPassword = box.read<String>('saved_password');
    if (savedEmail != null && savedPassword != null && savedEmail.isNotEmpty && savedPassword.isNotEmpty) {
      try {
        final res = await patientSupabaseClient.auth.signInWithPassword(
          email: savedEmail.trim().toLowerCase(),
          password: savedPassword.trim(),
        );
        return res.user != null;
      } catch (_) {}
    }
    return false;
  }

  /// Background-caches profile and patient data after a successful login/re-auth.
  Future<void> _cacheProfileAfterLogin(String userId) async {
    try {
      final profileData = await patientSupabaseClient
          .from('profiles')
          .select('name, email')
          .eq('id', userId)
          .maybeSingle();
      if (profileData != null && profileData['name'] != null) {
        final name = profileData['name'].toString();
        box.write('user_name', name);
        box.write('userName', name);
        box.write('user_email', profileData['email']?.toString());
        box.write('host_profile_name', name.split(' ')[0]);
      }
    } catch (_) {}
    try {
      final patientData = await patientSupabaseClient
          .from('patients')
          .select()
          .eq('user_id', userId)
          .maybeSingle();
      if (patientData != null) {
        box.write('patient_code', patientData['patient_code']?.toString());
        box.write('date_of_birth', patientData['date_of_birth']?.toString());
        box.write('weight_kg', patientData['weight_kg']);
        box.write('height_cm', patientData['height_cm']);
        box.write('dominant_hand', patientData['dominant_hand']?.toString());
        box.write('patient_phone', patientData['phone']?.toString());
      }
    } catch (_) {}
  }

  Future<String?> getUserId() async {
    // Prefer live session over stored value
    final liveId = patientSupabaseClient.auth.currentUser?.id;
    if (liveId != null) return liveId;
    return box.read("userId")?.toString();
  }

  Future<String?> getUserType() async {
    return box.read('userType')?.toString();
  }

  Future<void> signIn(
      String email, String password, String selectedUserType) async {
    try {
      final cleanEmail = email.trim().toLowerCase();
      final cleanPassword = password.trim();

      final res = await patientSupabaseClient.auth.signInWithPassword(
        email: cleanEmail,
        password: cleanPassword,
      );

      if (res.user == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Error Logging In',
          description: 'The account does not exist or password is wrong.',
        );
        return;
      }

      final userId = res.user!.id;

      // Verify user type matches selected type
      final profileData = await patientSupabaseClient
          .from('profiles')
          .select('user_type, name, email, dominant_hand')
          .eq('id', userId)
          .maybeSingle();

      final dbUserType = profileData?['user_type'] as String? ?? 'Patient';

      if (selectedUserType == 'Specialist' && dbUserType != 'Specialist') {
        await patientSupabaseClient.auth.signOut();
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Error Logging In',
          description: 'This account is not a specialist account.',
        );
        return;
      }

      // Persist auth and profile cache
      box.write('userId', userId);
      box.write('userType', dbUserType);
      box.write('userEmail', cleanEmail);
      box.write('saved_email', cleanEmail);
      box.write('saved_password', cleanPassword);

      if (profileData != null) {
        final name = profileData['name']?.toString() ?? 'User';
        box.write('user_name', name);
        box.write('userName', name);
        box.write('user_email', profileData['email']?.toString() ?? cleanEmail);
        box.write('host_profile_name', name.split(' ')[0]);
      }

      // Cache clinical data from patients table
      try {
        final patientData = await patientSupabaseClient
            .from('patients')
            .select()
            .eq('user_id', userId)
            .maybeSingle();
        if (patientData != null) {
          box.write('patient_code', patientData['patient_code']?.toString());
          box.write('date_of_birth', patientData['date_of_birth']?.toString());
          box.write('weight_kg', patientData['weight_kg']);
          box.write('height_cm', patientData['height_cm']);
          box.write('dominant_hand', patientData['dominant_hand']?.toString());
          box.write('patient_phone', patientData['phone']?.toString());
        }
      } catch (_) {}

      NavigationService().navigateToStartupView();
    } catch (e) {
      _logger.e('SignIn error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error Logging In',
        description: e.toString(),
      );
    }
  }

  Future<void> signUp(SignUpInfo signUpInfo) async {
    try {
      final res = await patientSupabaseClient.auth.signUp(
        email: signUpInfo.email,
        password: signUpInfo.password,
      );

      if (res.user == null) {
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Error Signing Up',
          description: 'Failed to create account. Try again.',
        );
        return;
      }

      final userId = res.user!.id;

      // Format dominant_hand properly:
      // profiles expects 'Left' or 'Right'
      final dominantHandText = (signUpInfo.dominantHand == 'Left' || signUpInfo.dominantHand == 'L')
          ? 'Left'
          : 'Right';
      // patients expects 'L' or 'R' (hand_type enum)
      final dominantHandEnum = (signUpInfo.dominantHand == 'Left' || signUpInfo.dominantHand == 'L')
          ? 'L'
          : 'R';

      // Step 1: Create minimal profile (only columns that exist in profiles table)
      await patientSupabaseClient.from('profiles').upsert({
        'id': userId,
        'name': signUpInfo.name,
        'email': signUpInfo.email,
        'dominant_hand': dominantHandText,
        'user_type': 'Patient',
      });

      // Generate a clean patient code for the new patient: PT-XXXX
      final patientCode = 'PT-${userId.substring(0, 4).toUpperCase()}';

      // Step 2: Create patient record with all clinical/physical data
      await patientSupabaseClient.from('patients').upsert({
        'user_id': userId,
        'name': signUpInfo.name,
        'email': signUpInfo.email,
        'phone': signUpInfo.phone.toString(),
        'patient_code': patientCode,
        'date_of_birth': signUpInfo.dob,
        'gender': signUpInfo.gender,
        'dominant_hand': dominantHandEnum,
        'weight_kg': signUpInfo.weight,
        'height_cm': signUpInfo.height,
        'palm_length_mm': signUpInfo.palmLength?.toInt(),
        'palm_width_mm': signUpInfo.palmWidth?.toInt(),
        'knuckle_length_mm': signUpInfo.knuckleLength?.toInt(),
        'city': signUpInfo.city,
        'country': signUpInfo.country,
        'address': signUpInfo.address,
        'pincode': signUpInfo.pincode?.toString(),
      });

      box.write('userId', userId);
      box.write('userType', 'Patient');
      box.write('userEmail', signUpInfo.email);

      NavigationService().navigateToDeviceView(showExistingDevices: false);
    } catch (e) {
      _logger.e('SignUp error: $e');
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Error Signing Up',
        description: e.toString(),
      );
    }
  }

  Future<void> signOut() async {
    await patientSupabaseClient.auth.signOut();
    await box.erase();
    final notif = locator<NotificationsService>();
    await notif.clearAllFutureNotifications();
    Fluttertoast.showToast(msg: "Logged Out Successfully");
    NavigationService().navigateToStartupView();
  }

  updateProfile(SignUpInfo signUpInfo) async {
    try {
      final userId = patientSupabaseClient.auth.currentUser?.id;
      if (userId == null) return;

      final dominantHandText = (signUpInfo.dominantHand == 'Left' || signUpInfo.dominantHand == 'L')
          ? 'Left'
          : 'Right';
      final dominantHandEnum = (signUpInfo.dominantHand == 'Left' || signUpInfo.dominantHand == 'L')
          ? 'L'
          : 'R';

      // Update minimal profile columns only
      await patientSupabaseClient.from('profiles').update({
        'name': signUpInfo.name,
        'dominant_hand': dominantHandText,
      }).eq('id', userId);

      // Update full clinical data in patients table
      await patientSupabaseClient.from('patients').update({
        'name': signUpInfo.name,
        'phone': signUpInfo.phone.toString(),
        'date_of_birth': signUpInfo.dob,
        'gender': signUpInfo.gender,
        'dominant_hand': dominantHandEnum,
        'weight_kg': signUpInfo.weight,
        'height_cm': signUpInfo.height,
        'palm_length_mm': signUpInfo.palmLength?.toInt(),
        'palm_width_mm': signUpInfo.palmWidth?.toInt(),
        'knuckle_length_mm': signUpInfo.knuckleLength?.toInt(),
        'city': signUpInfo.city,
        'country': signUpInfo.country,
        'address': signUpInfo.address,
        'pincode': signUpInfo.pincode?.toString(),
      }).eq('user_id', userId);

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
}
