import 'package:flutter/material.dart';
import 'package:stacked/stacked.dart';
import 'package:vital_step/ui/common/app_colors.dart';
import 'package:vital_step/ui/common/ui_helpers.dart';
import 'ble_scan_viewmodel.dart';

class BleScanView extends StackedView<BleScanViewModel> {
  const BleScanView({Key? key}) : super(key: key);

  @override
  Widget builder(
    BuildContext context,
    BleScanViewModel viewModel,
    Widget? child,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Device'),
        actions: [
          IconButton(
            icon: Icon(viewModel.isScanning ? Icons.stop : Icons.refresh),
            onPressed: viewModel.isScanning
                ? viewModel.stopScan
                : viewModel.startScan,
          )
        ],
      ),
      body: viewModel.isBusy
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  verticalSpaceMedium,
                  Text(viewModel.connectionStatus),
                ],
              ),
            )
          : viewModel.discoveredDevices.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (viewModel.isScanning) ...[
                          const CircularProgressIndicator(),
                          verticalSpaceMedium,
                          const Text(
                            'Scanning for VitalStep devices...',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                          ),
                          verticalSpaceSmall,
                          const Text(
                            'Make sure Wi-Fi Setup (BLE) mode is open on your device.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey),
                          ),
                        ] else ...[
                          const Icon(Icons.bluetooth_searching, size: 56, color: Colors.grey),
                          verticalSpaceMedium,
                          Text(
                            viewModel.scanError ?? 'No VitalStep devices found nearby.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 15),
                          ),
                          verticalSpaceMedium,
                          ElevatedButton.icon(
                            onPressed: viewModel.startScan,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry Scan'),
                          ),
                        ],
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    if (viewModel.isScanning)
                      const LinearProgressIndicator(),
                    Expanded(
                      child: ListView.builder(
                        itemCount: viewModel.discoveredDevices.length,
                        itemBuilder: (context, index) {
                          final result = viewModel.discoveredDevices[index];
                          return ListTile(
                            leading: const Icon(Icons.bluetooth, color: kcPrimaryColor),
                            title: Text(result.device.platformName.isNotEmpty
                                ? result.device.platformName
                                : result.advertisementData.advName),
                            subtitle: Text(result.device.remoteId.toString()),
                            trailing: ElevatedButton(
                              onPressed: () => viewModel.connectToDevice(result.device),
                              child: const Text('Connect'),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }

  @override
  BleScanViewModel viewModelBuilder(
    BuildContext context,
  ) =>
      BleScanViewModel();

  @override
  void onViewModelReady(BleScanViewModel viewModel) {
    viewModel.startScan();
  }
}
