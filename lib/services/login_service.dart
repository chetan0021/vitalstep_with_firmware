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
    final userId = await getUserId();
    return userId != null;
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
          .select('user_type')
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

      box.write('userId', userId);
      box.write('userType', dbUserType);
      box.write('userEmail', email);

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
