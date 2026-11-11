import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../theme/colors.dart';

class DevicePairingScreen extends StatefulWidget {
  const DevicePairingScreen({Key? key}) : super(key: key);

  @override
  State<DevicePairingScreen> createState() => _DevicePairingScreenState();
}

class _DevicePairingScreenState extends State<DevicePairingScreen> {
  final _codeController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(title: const Text('Pair New Device')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: VSColors.accentGradient,
                    ),
                    child: const Icon(
                      Icons.devices,
                      size: 50,
                      color: Colors.white,
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .scale(duration: 400.ms),
                  const SizedBox(height: 24),
                  Text(
                    'Add Your Device',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 100.ms),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your device code to get started',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: VSColors.textSecondary,
                        ),
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 200.ms),
                ],
              ),
            ),
            const SizedBox(height: 48),
            if (_error != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: VSColors.error.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: VSColors.error),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: VSColors.error),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: VSColors.error),
                      ),
                    ),
                  ],
                ),
              )
                  .animate()
                  .slideX()
                  .fadeIn(),
            if (_error != null) const SizedBox(height: 24),
            TextField(
              controller: _codeController,
              decoration: InputDecoration(
                hintText: 'Device Code (e.g., VS-92026)',
                prefixIcon: const Icon(Icons.qr_code_2),
                enabled: !_isLoading,
              ),
              textCapitalization: TextCapitalization.characters,
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 300.ms)
                .slideX(begin: -0.2, end: 0),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                hintText: 'Device Name',
                prefixIcon: const Icon(Icons.label),
                enabled: !_isLoading,
              ),
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 400.ms)
                .slideX(begin: -0.2, end: 0),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _pairDevice,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Pair Device'),
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 500.ms)
                .slideY(begin: 0.2, end: 0),
            const SizedBox(height: 24),
            Center(
              child: TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan QR Code'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pairDevice() async {
    if (_codeController.text.isEmpty || _nameController.text.isEmpty) {
      setState(() => _error = 'Please fill all fields');
      return;
    }

    setState(() {
      _error = null;
      _isLoading = true;
    });

    try {
      // ignore: use_build_context_synchronously
      await context.read<DeviceProvider>().pairDevice(
            _codeController.text.trim(),
            _nameController.text.trim(),
          );

      // ignore: use_build_context_synchronously
      if (context.mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device paired successfully!')),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _nameController.dispose();
    super.dispose();
  }
}
