import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:stacked/stacked.dart';
import 'package:stacked/stacked_annotations.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/services/specialist_service.dart';
import 'package:vital_step/ui/common/app_colors.dart';
import 'package:vital_step/ui/common/ui_helpers.dart';
import 'package:vital_step/ui/dialogs/add_patient/add_patient_dialog.form.dart';

import 'add_patient_dialog_model.dart';

@FormView(fields: [
  FormTextField(name: "email"),
  FormTextField(name: "accessCode"),
])
class AddPatientDialog extends StackedView<AddPatientDialogModel>
    with $AddPatientDialog {
  final DialogRequest request;
  final Function(DialogResponse) completer;

  const AddPatientDialog({
    Key? key,
    required this.request,
    required this.completer,
  }) : super(key: key);

  @override
  Widget builder(
    BuildContext context,
    AddPatientDialogModel viewModel,
    Widget? child,
  ) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(
                    color: Colors.grey.shade400,
                    width: 1.5,
                  ),
                ),
                labelText: 'Email',
                hintText: "Please enter patient's email",
                floatingLabelBehavior: FloatingLabelBehavior.always,
              ),
              controller: emailController,
            ),
            verticalSpaceSmall,
            TextFormField(
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(
                    color: Colors.grey.shade400,
                    width: 1.5,
                  ),
                ),
                labelText: 'Access Code',
                hintText: "Enter or scan patient's access code",
                floatingLabelBehavior: FloatingLabelBehavior.always,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner, color: kcPrimaryColor),
                  tooltip: 'Scan Patient QR',
                  onPressed: () => _openScanner(context),
                ),
              ),
              controller: accessCodeController,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                MaterialButton(
                    onPressed: () {
                      completer(DialogResponse(confirmed: false));
                    },
                    child: const Text("Cancel")),
                const SizedBox(width: 10),
                MaterialButton(
                  onPressed: () async {
                    final success = await viewModel.addPatient();
                    if (success) {
                      completer(DialogResponse(confirmed: true));
                    }
                  },
                  child: const Text('Add Patient'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  AddPatientDialogModel viewModelBuilder(BuildContext context) =>
      AddPatientDialogModel();

  void _openScanner(BuildContext context) {
    final MobileScannerController scannerController = MobileScannerController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Scan Patient QR Code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      scannerController.dispose();
                      Navigator.pop(ctx);
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    MobileScanner(
                      controller: scannerController,
                      onDetect: (capture) {
                        final barcode = capture.barcodes.firstOrNull;
                        if (barcode?.rawValue != null) {
                          final code = SpecialistService.parsePatientCode(barcode!.rawValue!);
                          scannerController.dispose();
                          Navigator.pop(ctx);
                          accessCodeController.text = code;
                        }
                      },
                    ),
                    Center(
                      child: Container(
                        width: 220,
                        height: 220,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.green, width: 3),
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(20.0),
              child: Text(
                'Point camera at the patient\'s QR code',
                style: TextStyle(color: Colors.white70),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void onViewModelReady(AddPatientDialogModel viewModel) {
    syncFormWithViewModel(viewModel);
  }
}
