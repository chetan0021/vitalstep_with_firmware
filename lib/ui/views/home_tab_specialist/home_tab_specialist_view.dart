import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:stacked/stacked.dart';
import 'package:stacked_services/stacked_services.dart';
import 'package:vital_step/Model/accounts.dart';
import 'package:vital_step/app/app.dialogs.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/app/app.router.dart';
import 'package:vital_step/ui/common/app_colors.dart';
import 'package:vital_step/ui/common/ui_helpers.dart';

import 'home_tab_specialist_viewmodel.dart';

class HomeTabSpecialistView extends StackedView<HomeTabSpecialistViewModel> {
  const HomeTabSpecialistView({Key? key}) : super(key: key);

  @override
  Widget builder(
    BuildContext context,
    HomeTabSpecialistViewModel viewModel,
    Widget? child,
  ) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text(
          'Vital Step',
        ),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: kcPrimaryColor),
            tooltip: 'Scan Patient QR',
            onPressed: () => _openScanner(context, viewModel),
          ),
        ],
      ),
      body: Container(
        padding: const EdgeInsets.only(left: 25.0, right: 25.0),
        child: ListView(
          children: [
            Image.asset(
              'assets/stethoscope.png',
              height: 200,
            ),
            verticalSpaceMedium,
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Hi ${viewModel.name != null ? ' ${viewModel.name}' : ''}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            verticalSpaceMedium,
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kcPrimaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => _openScanner(context, viewModel),
                  icon: const Icon(Icons.qr_code_scanner, size: 20),
                  label: const Text('Scan QR Code'),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: kcPrimaryColor,
                    side: const BorderSide(color: kcPrimaryColor),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    final DialogService dialogService =
                        locator<DialogService>();
                    await dialogService.showCustomDialog(
                        variant: DialogType.addPatient);
                    viewModel.patientAccounts = viewModel.getPatientAccounts();
                    viewModel.rebuildUi();
                  },
                  icon: const Icon(Icons.keyboard_outlined, size: 20),
                  label: const Text('Enter Code'),
                ),
              ],
            ),
            verticalSpaceMedium,
            FutureBuilder<List<Accounts>>(
                future: viewModel.patientAccounts,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: Colors.black,
                      ),
                    );
                  } else if (snapshot.hasError) {
                    return Center(
                      child: Text(
                        'Error loading patients: ${snapshot.error}',
                        style: const TextStyle(color: Colors.red),
                      ),
                    );
                  } else if (snapshot.connectionState == ConnectionState.done) {
                    final patients = snapshot.data ?? [];
                    if (patients.isEmpty) {
                      return Container(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        alignment: Alignment.center,
                        child: Column(
                          children: [
                            Icon(Icons.people_outline, size: 50, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              'No patients added yet',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.grey.shade600),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Tap "Add Patient" above to link a patient.',
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: patients.length,
                        itemBuilder: (context, index) {
                          final Accounts account = patients[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(vertical: 6),
                            elevation: 1,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: kcPrimaryColor,
                                child: Icon(Icons.person, color: Colors.white),
                              ),
                              title: Text(
                                account.user.name ?? 'Patient',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                'Code: ${account.user.access_code ?? "N/A"}',
                                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                              onTap: () {
                                final NavigationService navigationService =
                                    locator<NavigationService>();
                                navigationService.navigateToAssesmentView(
                                    isSpecialist: true, patientAccount: account);
                              },
                            ),
                          );
                        });
                  }
                  return const SizedBox();
                })
          ],
        ),
      ),
    );
  }

  @override
  HomeTabSpecialistViewModel viewModelBuilder(
    BuildContext context,
  ) =>
      HomeTabSpecialistViewModel();

  void _openScanner(BuildContext context, HomeTabSpecialistViewModel viewModel) {
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
                          final code = barcode!.rawValue!;
                          scannerController.dispose();
                          Navigator.pop(ctx);
                          viewModel.onQrScanned(code);
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
  void onViewModelReady(HomeTabSpecialistViewModel viewModel) {
    viewModel.patientAccounts = viewModel.getPatientAccounts();
    viewModel.init();
  }
}
