import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:stacked/stacked.dart';
import 'package:vital_step/app/app.locator.dart';
import 'package:vital_step/services/ble_provisioning_service.dart';

class AdminDeviceSetupViewModel extends ReactiveViewModel {
  final _bleService = locator<BleProvisioningService>();

  @override
  List<ListenableServiceMixin> get listenableServices => [_bleService];

  List<ScanResult> get discoveredDevices => _bleService.discoveredDevices;
  String get connectionStatus => _bleService.connectionStatus.value;
  String get deviceStatus => _bleService.wifiProvisionStatus.value;
  bool get isScanning => FlutterBluePlus.isScanningNow;
  bool get isConnected => _bleService.connectedDevice != null && connectionStatus == 'Connected';
  BluetoothDevice? get connectedDevice => _bleService.connectedDevice;

  String? errorMessage;
  String? successMessage;
  bool isFlashing = false;

  void startScan() async {
    errorMessage = null;
    try {
      await _bleService.startBleScan();
      notifyListeners();
    } catch (e) {
      errorMessage = 'Bluetooth Scan Error: $e';
      notifyListeners();
    }
  }

  void stopScan() async {
    await _bleService.stopBleScan();
    notifyListeners();
  }

  Future<void> connectToDevice(BluetoothDevice device) async {
    errorMessage = null;
    successMessage = null;
    await _bleService.stopBleScan();
    try {
      setBusy(true);
      await _bleService.connectToDevice(device);
      setBusy(false);
    } catch (e) {
      setBusy(false);
      errorMessage = 'Connection failed: $e';
      notifyListeners();
    }
  }

  Future<void> disconnect() async {
    await _bleService.disconnect();
    errorMessage = null;
    successMessage = null;
    notifyListeners();
  }

  Future<bool> flashDeviceIdentity({
    required String code,
    required String secret,
    String? deviceId,
  }) async {
    errorMessage = null;
    successMessage = null;

    final trimmedCode = code.trim().toUpperCase();
    final trimmedSecret = secret.trim();

    if (trimmedCode.isEmpty) {
      errorMessage = 'Please enter or paste a valid Device Code (e.g. VS-001002)';
      notifyListeners();
      return false;
    }

    if (trimmedSecret.length < 16) {
      errorMessage = 'Device Secret must be at least 16 characters (standard 64-char hex key)';
      notifyListeners();
      return false;
    }

    isFlashing = true;
    notifyListeners();

    try {
      await _bleService.sendAdminDeviceConfig(
        deviceCode: trimmedCode,
        deviceSecret: trimmedSecret,
        deviceId: deviceId,
      );

      // Wait a moment for device confirmation notification
      await Future.delayed(const Duration(milliseconds: 1500));

      isFlashing = false;
      successMessage = 'Success! Device $trimmedCode received credentials and is rebooting into new identity.';
      notifyListeners();
      return true;
    } catch (e) {
      isFlashing = false;
      errorMessage = 'OTA write failed: $e';
      notifyListeners();
      return false;
    }
  }

  Future<String?> pasteFromClipboard() async {
    try {
      final data = await Clipboard.getData(Clipboard.kTextPlain);
      return data?.text?.trim();
    } catch (e) {
      return null;
    }
  }

  @override
  void dispose() {
    _bleService.stopBleScan();
    super.dispose();
  }
}
