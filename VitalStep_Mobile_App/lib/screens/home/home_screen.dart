import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../theme/colors.dart';
import '../../models/device.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    // Load devices when home screen is opened
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeviceProvider>().loadDevices();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(
        title: const Text('VitalStep'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.of(context).pushNamed('/settings');
            },
          ),
        ],
      ),
      body: Consumer<DeviceProvider>(
        builder: (context, deviceProvider, _) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Welcome banner
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: VSColors.primaryGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: VSColors.primary.withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back!',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Monitor your palm pressure and track your health',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: -0.2, end: 0),

                // Devices section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Your Devices',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).pushNamed('/device-pairing');
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Add Device'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: VSColors.accent,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Device list
                if (deviceProvider.isLoading)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(VSColors.primary),
                    ),
                  )
                else if (deviceProvider.devices.isEmpty)
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: VSColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.devices_other,
                          size: 48,
                          color: VSColors.textTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No devices yet',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: VSColors.textSecondary,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Add your first VitalStep device to get started',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: VSColors.textTertiary,
                              ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: deviceProvider.devices.length,
                    itemBuilder: (context, index) {
                      final device = deviceProvider.devices[index];
                      return _DeviceCard(
                        device: device,
                        onTap: () {
                          deviceProvider.selectDevice(device);
                          Navigator.of(context).pushNamed('/device-detail');
                        },
                      )
                          .animate()
                          .fadeIn(
                            duration: 400.ms,
                            delay: Duration(ms: 100 * index),
                          )
                          .slideX(begin: 0.2, end: 0);
                    },
                  ),

                const SizedBox(height: 24),

                // Quick actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quick Actions',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        children: [
                          _QuickActionCard(
                            icon: Icons.pulse_checker,
                            title: 'Start Test',
                            color: VSColors.primary,
                            onTap: () {
                              Navigator.of(context).pushNamed('/measurement');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.history,
                            title: 'View History',
                            color: VSColors.accent,
                            onTap: () {
                              Navigator.of(context).pushNamed('/history');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.insights,
                            title: 'Insights',
                            color: VSColors.warning,
                            onTap: () {
                              Navigator.of(context).pushNamed('/insights');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.download,
                            title: 'Export Data',
                            color: VSColors.success,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Export feature coming soon')),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _DeviceCard extends StatelessWidget {
  final Device device;
  final VoidCallback onTap;

  const _DeviceCard({
    required this.device,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: VSColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: VSColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Color(device.statusColor),
                    Color(device.statusColor).withOpacity(0.6),
                  ],
                ),
              ),
              child: const Icon(
                Icons.devices,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(device.statusColor),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        device.status,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: VSColors.textSecondary,
                            ),
                      ),
                      const SizedBox(width: 12),
                      Icon(
                        Icons.battery_charging_full,
                        size: 14,
                        color: VSColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${device.batteryPct}%',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: VSColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: VSColors.textTertiary,
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final int color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: VSColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: VSColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Color(color).withOpacity(0.2),
              ),
              child: Icon(icon, color: Color(color), size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.labelLarge,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
