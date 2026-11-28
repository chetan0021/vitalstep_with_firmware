import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:intl/intl.dart';
import 'package:stacked/stacked.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/Model/profile.dart';
import 'package:vital_step/Model/SignUpInfo.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.logger.dart';
import 'package:vital_step/services/login_service.dart';
import 'package:vital_step/ui/common/FormValidators.dart';
import 'package:vital_step/ui/views/sign_up/sign_up_view.form.dart';

class SignUpViewModel extends FormViewModel {
  final _logger = getLogger("SignUpViewModel");
  final formKey = GlobalKey<FormState>();
  bool passwordVisible = true;
  final _dialogService = locator<DialogService>();
  TextEditingController viewDobController = TextEditingController();
  final LoginService loginService = locator<LoginService>();
  bool isTermsAccepted = false;
  void init() {}

  void setDOB(BuildContext context) async {
    await selectDob(
        context: context,
        firstDate: DateTime.now().subtract(const Duration(days: 365 * 75)),
        initialDate: DateTime.now(),
        lastDate: DateTime.now());
    try {
      String dateOfBirth = DateFormat("dd-MM-yyyy").format(dobValue!);
      viewDobController.text = dateOfBirth;
      rebuildUi();
    } catch (e) {
      _logger.e(e);
    }
  }

  Future<void> saveData({required bool update}) async {
    setBusy(true);
    if (!formKey.currentState!.validate()) {
      _logger.e("Form Fields are not valid");
      Fluttertoast.showToast(msg: "Please check the form once again");
    } else if (FormValidators.nameValidator(nameValue) != null) {
      final message = FormValidators.nameValidator(nameValue);
      _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Invalid name',
          description: message);
    } else if (FormValidators.mobileNumberValidator(mobileNumberValue) !=
        null) {
      final message = FormValidators.mobileNumberValidator(mobileNumberValue);
      _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Invalid mobile Number',
          description: message);
    } else if (FormValidators.emailValidator(emailValue) != null) {
      final message = FormValidators.emailValidator(emailValue);
      _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Invalid name',
          description: message);
    } else if (!update && FormValidators.passwordValidator(passwordValue) != null) {
      final message = FormValidators.passwordValidator(passwordValue);
      _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Invalid password',
          description: message);
    } else if (_parseDob(viewDobController.text) == null ||
        FormValidators.dobValidator(_parseDob(viewDobController.text)!) !=
            null) {
      final parsed = _parseDob(viewDobController.text);
      final message = parsed == null
          ? 'Please select your Date of Birth'
          : FormValidators.dobValidator(parsed);
      _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Invalid Date of Birth',
          description: message);
    } else if (!hasCountryCodesDropDown) {
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: "No Country Code Selected",
        description: 'Please select Country to continue',
      );
    } else if (!hasGender) {
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: "No Gender Selected",
        description: 'Please select gender to continue',
      );
    } else if (!hasDominantHand) {
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'No Dominant Hand Selected',
        description: 'Please select dominant hand to continue',
      );
    } else if (FormValidators.mobileNumberValidator(mobileNumberValue) !=
        null) {
      final message = FormValidators.mobileNumberValidator(mobileNumberValue);
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Something wrong with phone number',
        description: message,
      );
    } else if (update == false && isTermsAccepted == false) {
      _dialogService.showCustomDialog(
        variant: DialogType.infoAlert,
        title: 'Terms and Conditions',
        description: 'Please accept the terms and conditions to continue',
      );
    } else {
      try {
        final parsedDob = dobValue ?? _parseDob(viewDobController.text);
        SignUpInfo signUpInfo = SignUpInfo(
            name: nameValue!,
            phone: int.parse(mobileNumberValue!),
            email: emailValue!,
            password: passwordValue ?? '',
            dob: parsedDob != null ? DateFormat("yyyy-MM-dd").format(parsedDob) : viewDobController.text, // Use ISO format for backend
            city: cityValue,
            country: countryValue,
            pincode: int.tryParse(pincodeValue!),
            address: addressValue,
            weight: int.parse(weightValue!),
            height: int.parse(heightValue!),
            palmLength: double.tryParse(palmLengthValue!),
            palmWidth: double.tryParse(palmWidthValue!),
            knuckleLength: double.tryParse(knucklesLengthValue!),
            dominantHand: dominantHandValue!,
            gender: genderValue!,
            countryCode: countryCodesDropDownValue ?? "+91");

        _logger.i("SignUpInfo to json ${signUpInfo.toJson()}");
        _logger.i("Form is valid");
        if (update) {
          await loginService.updateProfile(signUpInfo);
        } else {
          await loginService.signUp(
            signUpInfo,
          );
        }
      } catch (e) {
        _logger.e(e);
        _dialogService.showCustomDialog(
          variant: DialogType.infoAlert,
          title: 'Something went wrong',
          description: e.toString(),
        );
      }
    }
    setBusy(false);
  }

  DateTime? _parseDob(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final trimmed = raw.trim();
    final iso = DateTime.tryParse(trimmed);
    if (iso != null) return iso;
    try {
      return DateFormat("dd-MM-yyyy").parse(trimmed);
    } catch (_) {
      return null;
    }
  }

  void setProfile(Profile profile) {
    nameValue = profile.name ?? '';
    setCountryCodesDropDown(
      (profile.countryCode.isNotEmpty) ? profile.countryCode : '+91',
    );
    mobileNumberValue = profile.phone?.toString() ?? '';
    emailValue = profile.email ?? '';
    addressValue = profile.address ?? '';
    cityValue = profile.city ?? '';
    pincodeValue = profile.pincode == null ? "" : profile.pincode.toString();
    countryValue = profile.country ?? '';
    weightValue = profile.weight > 0 ? profile.weight.toString() : '';
    heightValue = profile.height > 0 ? profile.height.toString() : '';
    palmLengthValue =
        profile.palmLength == null ? "" : profile.palmLength.toString();
    palmWidthValue =
        profile.palmWidth == null ? "" : profile.palmWidth.toString();
    knucklesLengthValue =
        profile.knucklesLength == null ? "" : profile.knucklesLength.toString();

    final rawHand = profile.dominantHand ?? 'Right';
    final normalizedHand = (rawHand == 'L' || rawHand == 'Left') ? 'Left' : 'Right';
    setDominantHand(normalizedHand);

    final rawGender = profile.gender;
    if (rawGender != null &&
        const ['Male', 'Female', 'Prefer not to say', 'Other'].contains(rawGender)) {
      setGender(rawGender);
    } else {
      setGender('Male');
    }

    final parsedDob = _parseDob(profile.dob);
    if (parsedDob != null) {
      viewDobController.text = DateFormat("dd-MM-yyyy").format(parsedDob);
    }
  }
}
