import 'package:flutter/material.dart';
import 'package:stacked/stacked.dart';
import 'package:vital_step/ui/common/app_colors.dart';
import 'package:vital_step/ui/common/ui_helpers.dart';
import 'admin_device_setup_viewmodel.dart';

class AdminDeviceSetupView extends StackedView<AdminDeviceSetupViewModel> {
  const AdminDeviceSetupView({Key? key}) : super(key: key);

  @override
  Widget builder(
    BuildContext context,
    AdminDeviceSetupViewModel viewModel,
    Widget? child,
  ) {
    return _AdminDeviceSetupContent(viewModel: viewModel);
  }

  @override
  AdminDeviceSetupViewModel viewModelBuilder(BuildContext context) =>
      AdminDeviceSetupViewModel();

  @override
  void onViewModelReady(AdminDeviceSetupViewModel viewModel) {
    viewModel.startScan();
  }
}

class _AdminDeviceSetupContent extends StatefulWidget {
  final AdminDeviceSetupViewModel viewModel;
  const _AdminDeviceSetupContent({Key? key, required this.viewModel})
      : super(key: key);

  @override
  State<_AdminDeviceSetupContent> createState() =>
      _AdminDeviceSetupContentState();
}

class _AdminDeviceSetupContentState extends State<_AdminDeviceSetupContent> {
  final TextEditingController _codeController = TextEditingController();
  final TextEditingController _secretController = TextEditingController();
  final TextEditingController _idController = TextEditingController();
  bool _obscureSecret = true;

  @override
  void dispose() {
    _codeController.dispose();
    _secretController.dispose();
    _idController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = widget.viewModel;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kcDarkGreyColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          "Admin Device Provisioning",
          style: TextStyle(
            color: kcDarkGreyColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              vm.isScanning ? Icons.stop_circle_outlined : Icons.refresh,
              color: kcPrimaryColor,
            ),
            tooltip: vm.isScanning ? "Stop Scan" : "Scan BLE",
            onPressed: vm.isScanning ? vm.stopScan : vm.startScan,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Admin Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: kcPrimaryColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kcPrimaryColor.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield_outlined,
                      size: 20, color: kcPrimaryColor),
                  horizontalSpaceSmall,
                  const Expanded(
                    child: Text(
                      "OTA Identity & Secret Provisioning (Admin Mode)",
                      style: TextStyle(
                        color: kcPrimaryColorDark,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            verticalSpaceMedium,

            // Error Message
            if (vm.errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kcErrorColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kcErrorColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: kcErrorColor, size: 20),
                    horizontalSpaceSmall,
                    Expanded(
                      child: Text(
                        vm.errorMessage!,
                        style: const TextStyle(
                            color: kcErrorColor, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              verticalSpaceMedium,
            ],

            // Success Message
            if (vm.successMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kcSuccessColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kcSuccessColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline,
                        color: kcSuccessColor, size: 20),
                    horizontalSpaceSmall,
                    Expanded(
                      child: Text(
                        vm.successMessage!,
                        style: const TextStyle(
                            color: kcSuccessColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              verticalSpaceMedium,
            ],

            // Step 1: Device Connection
            _buildSectionHeader("1. CONNECT VITALSTEP DEVICE (BLE)"),
            verticalSpaceSmall,
            _buildDeviceSection(vm),
            verticalSpaceLarge,

            // Step 2: Over-The-Air Identity Provisioning
            _buildSectionHeader("2. WRITE NEW DEVICE CREDENTIALS"),
            verticalSpaceSmall,
            _buildConfigForm(vm),
            verticalSpaceLarge,
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.8,
        color: kcMediumGrey,
      ),
    );
  }

  Widget _buildDeviceSection(AdminDeviceSetupViewModel vm) {
    if (vm.isConnected) {
      final name = vm.connectedDevice?.platformName.isNotEmpty == true
          ? vm.connectedDevice!.platformName
          : "VitalStep Device";

      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kcSuccessColor.withOpacity(0.4)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: kcSuccessColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.bluetooth_connected,
                  color: kcSuccessColor, size: 24),
            ),
            horizontalSpaceMedium,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: kcDarkGreyColor,
                    ),
                  ),
                  Text(
                    "Connected | ${vm.connectedDevice?.remoteId.str ?? ''}",
                    style: const TextStyle(color: kcSuccessColor, fontSize: 12),
                  ),
                  if (vm.deviceStatus.isNotEmpty)
                    Text(
                      "Device Status: ${vm.deviceStatus}",
                      style:
                          const TextStyle(color: kcMediumGrey, fontSize: 11),
                    ),
                ],
              ),
            ),
            OutlinedButton(
              onPressed: vm.disconnect,
              style: OutlinedButton.styleFrom(
                foregroundColor: kcErrorColor,
                side: BorderSide(color: kcErrorColor.withOpacity(0.4)),
              ),
              child: const Text("Disconnect"),
            ),
          ],
        ),
      );
    }

    // Scanning or Disconnected list
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kcLightGrey),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    if (vm.isScanning)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: kcPrimaryColor),
                      )
                    else
                      const Icon(Icons.bluetooth_searching,
                          size: 18, color: kcMediumGrey),
                    horizontalSpaceSmall,
                    Text(
                      vm.isScanning
                          ? "Scanning for PalmPressure devices..."
                          : "Available Devices (${vm.discoveredDevices.length})",
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: vm.isScanning ? vm.stopScan : vm.startScan,
                  child: Text(vm.isScanning ? "Stop" : "Scan Again"),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (vm.discoveredDevices.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(Icons.devices,
                      size: 36, color: kcMediumGrey.withOpacity(0.4)),
                  verticalSpaceSmall,
                  const Text(
                    "No VitalStep devices found in setup mode.",
                    style: TextStyle(color: kcMediumGrey, fontSize: 13),
                  ),
                  verticalSpaceTiny,
                  const Text(
                    "On device: Tap 'Wi-Fi Setup' on Setup or Settings screen to start Bluetooth.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kcMediumGrey, fontSize: 11),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: vm.discoveredDevices.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final r = vm.discoveredDevices[index];
                final name = r.device.platformName.isNotEmpty
                    ? r.device.platformName
                    : r.advertisementData.advName;
                return ListTile(
                  leading: const Icon(Icons.bluetooth, color: kcPrimaryColor),
                  title: Text(
                    name.isNotEmpty ? name : "PalmPressure Device",
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  subtitle: Text("${r.device.remoteId} | RSSI ${r.rssi} dBm",
                      style:
                          const TextStyle(color: kcMediumGrey, fontSize: 11)),
                  trailing: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kcPrimaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => vm.connectToDevice(r.device),
                    child: const Text("Connect"),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildConfigForm(AdminDeviceSetupViewModel vm) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kcLightGrey),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Device Code
          const Text(
            "Device Code (Hardware ID)",
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
          verticalSpaceTiny,
          TextFormField(
            controller: _codeController,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              hintText: "e.g. VS-001002",
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: kcLightGrey),
              ),
              suffixIcon: IconButton(
                icon: const Icon(Icons.content_paste, color: kcPrimaryColor),
                tooltip: "Paste from clipboard",
                onPressed: () async {
                  final text = await vm.pasteFromClipboard();
                  if (text != null && mounted) {
                    setState(() => _codeController.text = text);
                  }
                },
              ),
            ),
          ),
          verticalSpaceMedium,

          // Device Secret
          const Text(
            "Device Secret (SHA-256 Key)",
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
          verticalSpaceTiny,
          TextFormField(
            controller: _secretController,
            obscureText: _obscureSecret,
            decoration: InputDecoration(
              hintText: "64-character secret key from admin dashboard",
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: kcLightGrey),
              ),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: Icon(
                      _obscureSecret ? Icons.visibility_off : Icons.visibility,
                      color: kcMediumGrey,
                    ),
                    onPressed: () =>
                        setState(() => _obscureSecret = !_obscureSecret),
                  ),
                  IconButton(
                    icon:
                        const Icon(Icons.content_paste, color: kcPrimaryColor),
                    tooltip: "Paste secret",
                    onPressed: () async {
                      final text = await vm.pasteFromClipboard();
                      if (text != null && mounted) {
                        setState(() => _secretController.text = text);
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
          verticalSpaceMedium,

          // Optional Device UUID
          const Text(
            "Cloud Device UUID (Optional)",
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
          verticalSpaceTiny,
          TextFormField(
            controller: _idController,
            decoration: InputDecoration(
              hintText: "Optional Supabase device ID record",
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: kcLightGrey),
              ),
              suffixIcon: IconButton(
                icon: const Icon(Icons.content_paste, color: kcMediumGrey),
                onPressed: () async {
                  final text = await vm.pasteFromClipboard();
                  if (text != null && mounted) {
                    setState(() => _idController.text = text);
                  }
                },
              ),
            ),
          ),
          verticalSpaceMedium,

          // Notice Info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF9E6),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFFFD54F)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, color: Color(0xFFF57F17), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Flashing will atomically rewrite /devicecode.txt and /devicesecret.txt on the device SD card & NVS flash, reset pairing, and restart the hardware.",
                    style: TextStyle(color: Color(0xFF5D4037), fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
          verticalSpaceMedium,

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    vm.isConnected ? kcPrimaryColor : Colors.grey.shade400,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              icon: vm.isFlashing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.system_update_alt),
              label: Text(
                vm.isFlashing
                  ? "Writing to Hardware (OTA)..."
                  : (vm.isConnected
                      ? "Write Identity to Device (OTA)"
                      : "Connect to Device First"),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              onPressed: (!vm.isConnected || vm.isFlashing)
                  ? null
                  : () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text("Confirm Device Overwrite"),
                          content: Text(
                            "Are you sure you want to write Device Code '${_codeController.text.trim()}' and new secret to this hardware?",
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(false),
                              child: const Text("Cancel"),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                  backgroundColor: kcPrimaryColor),
                              onPressed: () => Navigator.of(ctx).pop(true),
                              child: const Text("Write & Reboot"),
                            ),
                          ],
                        ),
                      );

                      if (confirmed == true) {
                        await vm.flashDeviceIdentity(
                          code: _codeController.text,
                          secret: _secretController.text,
                          deviceId: _idController.text,
                        );
                      }
                    },
            ),
          ),
        ],
      ),
    );
  }
}
