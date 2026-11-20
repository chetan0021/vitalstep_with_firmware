import 'package:fluttertoast/fluttertoast.dart';
import 'package:stacked/stacked.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/services/specialist_service.dart';
import 'package:vital_step/ui/dialogs/add_patient/add_patient_dialog.form.dart';

class AddPatientDialogModel extends FormViewModel {
  final SpecialistService _specialistService = locator<SpecialistService>();
  Future<bool> addPatient() async {
    final email = emailValue?.trim() ?? "";
    final code = accessCodeValue?.trim() ?? "";
    if (email.isNotEmpty || code.isNotEmpty) {
      try {
        await _specialistService.addPatient(
            patientEmail: email, patientAccessCode: code);
        return true;
      } catch (e) {
        Fluttertoast.showToast(
          msg: "Failed to add patient: ${e.toString()}",
        );
        return false;
      }
    } else {
      Fluttertoast.showToast(
          msg: "Please provide an access code or email",
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          timeInSecForIosWeb: 1,
          fontSize: 16.0);
    }
    return false;
  }
}
