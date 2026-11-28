import 'package:flutter/material.dart';
import 'package:stacked/stacked.dart';
import 'package:vital_step/ui/common/app_colors.dart';
import 'package:vital_step/ui/common/ui_helpers.dart';
import 'wifi_scan_viewmodel.dart';

class WifiScanView extends StackedView<WifiScanViewModel> {
  const WifiScanView({Key? key}) : super(key: key);

  @override
  Widget builder(
    BuildContext context,
    WifiScanViewModel viewModel,
    Widget? child,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Wi-Fi'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: viewModel.cancel,
        ),
        actions: [
          IconButton(
            icon: viewModel.isScanningWifi
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh),
            tooltip: 'Rescan Wi-Fi',
            onPressed: viewModel.isScanningWifi ? null : viewModel.startWifiScan,
          ),
        ],
      ),
      body: viewModel.isScanningWifi
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  verticalSpaceMedium,
                  Text('Scanning for nearby networks...'),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: viewModel.scannedNetworks.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.wifi_off, size: 56, color: Colors.grey),
                                verticalSpaceMedium,
                                Text(
                                  viewModel.scanError ?? 'No Wi-Fi networks found.',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 15),
                                ),
                                verticalSpaceMedium,
                                ElevatedButton.icon(
                                  onPressed: viewModel.startWifiScan,
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Retry Scan'),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: viewModel.scannedNetworks.length,
                          itemBuilder: (context, index) {
                            final net = viewModel.scannedNetworks[index];
                            final ssid = net['ssid'] as String;
                            final isSecure = net['secure'] == true;

                            return ListTile(
                              leading: const Icon(Icons.wifi, color: kcPrimaryColor),
                              title: Text(ssid),
                              trailing: isSecure ? const Icon(Icons.lock, size: 16) : null,
                              onTap: () => viewModel.selectNetwork(ssid),
                            );
                          },
                        ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      TextButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Rescan'),
                        onPressed: viewModel.startWifiScan,
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Enter Wi-Fi manually'),
                        onPressed: viewModel.enterManualNetwork,
                      ),
                    ],
                  ),
                )
              ],
            ),
    );
  }

  @override
  WifiScanViewModel viewModelBuilder(
    BuildContext context,
  ) =>
      WifiScanViewModel();

  @override
  void onViewModelReady(WifiScanViewModel viewModel) {
    viewModel.startWifiScan();
  }
}
