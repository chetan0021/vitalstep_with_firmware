import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../theme/colors.dart';

class DeviceDetailScreen extends StatefulWidget {
  const DeviceDetailScreen({Key? key}) : super(key: key);

  @override
  State<DeviceDetailScreen> createState() => _DeviceDetailScreenState();
}

class _DeviceDetailScreenState extends State<DeviceDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DeviceProvider>(
      builder: (context, deviceProvider, _) {
        final device = deviceProvider.selectedDevice;
        if (device == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Device')),
            body: const Center(child: Text('No device selected')),
          );
        }

        return Scaffold(
          backgroundColor: VSColors.background,
          appBar: AppBar(
            title: Text(device.name),
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(icon: Icon(Icons.info_outline), text: 'Info'),
                Tab(icon: Icon(Icons.activity_zone), text: 'Activity'),
                Tab(icon: Icon(Icons.settings_suggest), text: 'Settings'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              // Info tab
              _InfoTab(device: device),
              // Activity tab
              _ActivityTab(device: device),
              // Settings tab
              _SettingsTab(device: device),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

class _InfoTab extends StatelessWidget {
  final device;

  const _InfoTab({required this.device});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: VSColors.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: VSColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Device Status',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _InfoItem(
                      label: 'Status',
                      value: device.status,
                      color: Color(device.statusColor),
                    ),
                    _InfoItem(
                      label: 'Battery',
                      value: '${device.batteryPct}%',
                      color: device.batteryPct > 50
                          ? VSColors.success
                          : device.batteryPct > 10
                              ? VSColors.warning
                              : VSColors.error,
                    ),
                    _InfoItem(
                      label: 'Paired',
                      value: device.paired ? 'Yes' : 'No',
                      color: device.paired ? VSColors.success : VSColors.warning,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Device Information',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          _DetailRow(label: 'Device Code', value: device.code),
          _DetailRow(label: 'Device ID', value: device.id),
          _DetailRow(label: 'Hardware', value: device.hardwareName ?? 'N/A'),
          _DetailRow(label: 'Firmware', value: device.firmwareVersion ?? 'N/A'),
          _DetailRow(
            label: 'Last Sync',
            value: device.lastSync.toString().split('.')[0],
          ),
        ],
      ),
    );
  }
}

class _ActivityTab extends StatelessWidget {
  final device;

  const _ActivityTab({required this.device});

  @override
  Widget build(BuildContext context) {
    return Consumer<MeasurementProvider>(
      builder: (context, measurementProvider, _) {
        return FutureBuilder(
          future: Future.delayed(
            const Duration(milliseconds: 500),
            () => measurementProvider.loadMeasurements(device.id),
          ),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (measurementProvider.measurements.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.history,
                      size: 64,
                      color: VSColors.textTertiary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No measurements yet',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: VSColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/measurement');
                      },
                      child: const Text('Start First Test'),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: measurementProvider.measurements.length,
              itemBuilder: (context, index) {
                final measurement = measurementProvider.measurements[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: VSColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: VSColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: measurement.hand == 'L'
                              ? VSColors.leftHand.withOpacity(0.2)
                              : VSColors.rightHand.withOpacity(0.2),
                        ),
                        child: Icon(
                          measurement.hand == 'L'
                              ? Icons.pan_tool_alt
                              : Icons.hand_bones,
                          color: measurement.hand == 'L'
                              ? VSColors.leftHand
                              : VSColors.rightHand,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${measurement.handDisplay} Hand - ${measurement.postureDisplay}',
                              style: Theme.of(context).textTheme.labelLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${measurement.peakReading.toStringAsFixed(1)} kg',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: VSColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        measurement.recordedAt.toString().split('.')[0].split(' ')[0],
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: VSColors.textTertiary,
                            ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}

class _SettingsTab extends StatelessWidget {
  final device;

  const _SettingsTab({required this.device});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          ListTile(
            title: const Text('Generate Test Data'),
            subtitle: const Text('Create sample measurements for testing'),
            onTap: () {
              context.read<MeasurementProvider>().generateTestData(device.id);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Test data generated')),
              );
            },
          ),
          const Divider(color: VSColors.border),
          ListTile(
            title: const Text('Rename Device'),
            leading: const Icon(Icons.edit),
            onTap: () {},
          ),
          const Divider(color: VSColors.border),
          ListTile(
            title: const Text('Unpair Device'),
            leading: const Icon(Icons.link_off, color: VSColors.warning),
            onTap: () {
              _showUnpairDialog(context);
            },
          ),
        ],
      ),
    );
  }

  void _showUnpairDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unpair Device?'),
        content: const Text(
          'This device will be removed from your account. You can pair it again later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.read<DeviceProvider>().unpairDevice(device.id);
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text(
              'Unpair',
              style: TextStyle(color: VSColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _InfoItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withOpacity(0.2),
          ),
          child: Center(
            child: Text(
              value[0],
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: color,
              ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: VSColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: VSColors.textSecondary,
                ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}
